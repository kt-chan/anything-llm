import { memo, useState } from "react";
import { v4 } from "uuid";
import { decode as HTMLDecode } from "he";
import truncate from "truncate";
import ModalWrapper from "@/components/ModalWrapper";
import { middleTruncate } from "@/utils/directories";
import {
  CaretRight,
  FileText,
  Info,
  ArrowSquareOut,
  GithubLogo,
  Link,
  X,
  YoutubeLogo,
} from "@phosphor-icons/react";
import ConfluenceLogo from "@/media/dataConnectors/confluence.png";
import { Tooltip } from "react-tooltip";
import { toPercentString } from "@/utils/numbers";
import Document from "@/models/document";

//@DEBUG @KTCHAN @s3a @(6) @TODO citations download
function downloadLink(source) {
  console.log("downloading source file:", source)
  // files.push(source);
  Document.downloadFile(source);
 }

function combineLikeSources(sources) {
  const combined = {};
  sources.forEach((source) => {
    const { name, id, title, text, chunkSource = "", rawLocation = "", score = null } = source;
    if (combined.hasOwnProperty(title)) {
      combined[title].chunks.push({id, text, chunkSource, score });
      combined[title].name = name;
      combined[title].rawLocation = rawLocation;
      combined[title].references += 1;
    } else {
      combined[title] = {
        title,
        chunks: [{ id, text, chunkSource, score }],
        references: 1,
        name: name,
        rawLocation: rawLocation,
      };
    }
  });
  return Object.values(combined);
}

export default function Citations({ sources = [] }) {
  if (sources.length === 0) return null;
  const [open, setOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);



  return (
    <div className="flex flex-col mt-4 justify-left">
      <button
        onClick={() => setOpen(!open)}
        className={`text-white/50 font-medium italic text-sm text-left ml-14 pt-2 ${open ? "pb-2" : ""
          } hover:text-white/75 transition-all duration-300`}
      >
        {open ? "Hide Citations" : "Show Citations"}
        <CaretRight
          className={`w-3.5 h-3.5 inline-block ml-1 transform transition-transform duration-300 ${open ? "rotate-90" : ""
            }`}
        />
      </button>
      {open && (
        <div className="flex flex-wrap md:flex-row md:items-center gap-4 overflow-x-scroll mt-1 doc__source ml-14">
          {combineLikeSources(sources).map((source) => (
            <Citation
              key={v4()}
              source={source}
              onClick={() => setSelectedSource(source)}
              onDownload={() => downloadLink(source)}
            />
          ))}
        </div>
      )}
      {selectedSource && (
        <CitationDetailModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
}

const Citation = memo(({ source, onClick, onDownload }) => {
  const { title } = source;
  if (!title) return null;
  const chunkSourceInfo = parseChunkSource(source);
  const truncatedTitle = chunkSourceInfo?.text ?? middleTruncate(title, 25);
  const CitationIcon = ICONS.hasOwnProperty(chunkSourceInfo?.icon)
    ? ICONS[chunkSourceInfo.icon]
    : ICONS.file;
  
  return (
    <div className="flex flex-row justify-between items-center">
      <div
        className="flex flex-row justify-center items-center cursor-pointer text-sky-400"
        onClick={onClick}
      >
        <CitationIcon className="w-6 h-6" weight="bold" />
        <p className="text-sm font-medium whitespace-nowrap">{truncatedTitle}</p>
      </div>
      <div
        className="flex flex-row justify-center items-center cursor-pointer text-green-400"
        onClick={onDownload}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-sm font-medium whitespace-nowrap"
        >
          <path
            d="M5.25589 16C3.8899 15.0291 3 13.4422 3 11.6493C3 9.20008 4.8 6.9375 7.5 6.5C8.34694 4.48637 10.3514 3 12.6893 3C15.684 3 18.1317 5.32251 18.3 8.25C19.8893 8.94488 21 10.6503 21 12.4969C21 14.0582 20.206 15.4339 19 16.2417M12 21V11M12 21L9 18M12 21L15 18"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  );
});

function SkeletonLine() {
  const numOfBoxes = Math.floor(Math.random() * 5) + 2;
  return (
    <div className="flex space-x-2 mb-2">
      {Array.from({ length: numOfBoxes }).map((_, index) => (
        <div
          key={index}
          className="bg-white/20 rounded"
          style={{
            width: `${Math.random() * 150 + 50}px`,
            height: "20px",
          }}
        ></div>
      ))}
    </div>
  );
}

function omitChunkHeader(text) {
  if (!text.startsWith("<document_metadata>")) return text;
  return text.split("</document_metadata>")[1].trim();
}

function CitationDetailModal({ source, onClose }) {
  const { references, title, chunks } = source;
  const { isUrl, text: webpageUrl, href: linkTo } = parseChunkSource(source);

  return (
    <ModalWrapper isOpen={source}>
      <div className="w-full max-w-2xl bg-main-gradient rounded-lg shadow border border-white/10 overflow-hidden">
        <div className="relative p-6 border-b rounded-t border-gray-500/50">
          <div className="w-full flex gap-x-2 items-center">
            {isUrl ? (
              <a
                href={linkTo}
                target="_blank"
                rel="noreferrer"
                className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap hover:underline hover:text-blue-300 flex items-center gap-x-1"
              >
                <h3 className="flex items-center gap-x-1">
                  {webpageUrl}
                  <ArrowSquareOut />
                </h3>
              </a>
            ) : (
              <h3 className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap">
                {truncate(title, 45)}
              </h3>
            )}
          </div>
          {references > 1 && (
            <p className="text-xs text-gray-400 mt-2">
              Referenced {references} times.
            </p>
          )}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-6 right-6 transition-all duration-300 text-gray-400 bg-transparent hover:border-white/60 rounded-lg text-sm p-1.5 inline-flex items-center bg-sidebar-button hover:bg-menu-item-selected-gradient hover:border-slate-100 hover:border-opacity-50 border-transparent border"
          >
            <X className="text-gray-300 text-lg" />
          </button>
        </div>
        <div
          className="h-full w-full overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="p-6 space-y-2 flex-col">
            {[...Array(3)].map((_, idx) => (
              <SkeletonLine key={idx} />
            ))}
            {chunks.map(({ text, score }, idx) => (
              <div key={idx} className="pt-6 text-white">
                <div className="flex flex-col w-full justify-start pb-6 gap-y-1">
                  <p className="text-white whitespace-pre-line">
                    {HTMLDecode(omitChunkHeader(text))}
                  </p>

                  {!!score && (
                    <>
                      <div className="w-full flex items-center text-xs text-white/60 gap-x-2 cursor-default">
                        <div
                          data-tooltip-id="similarity-score"
                          data-tooltip-content={`This is the semantic similarity score of this chunk of text compared to your query calculated by the vector database.`}
                          className="flex items-center gap-x-1"
                        >
                          <Info size={14} />
                          <p>{toPercentString(score)} match</p>
                        </div>
                      </div>
                      <Tooltip
                        id="similarity-score"
                        place="top"
                        delayShow={100}
                      />
                    </>
                  )}
                </div>
                {[...Array(3)].map((_, idx) => (
                  <SkeletonLine key={idx} />
                ))}
              </div>
            ))}
            <div className="mb-6"></div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// Show the correct title and/or display text for citations
// which contain valid outbound links that can be clicked by the
// user when viewing a citation. Optionally allows various icons
// to show distinct types of sources.
function parseChunkSource({ title = "", chunks = [] }) {
  const nullResponse = {
    isUrl: false,
    text: null,
    href: null,
    icon: "file",
  };

  if (
    !chunks.length ||
    (!chunks[0].chunkSource?.startsWith("link://") &&
      !chunks[0].chunkSource?.startsWith("confluence://") &&
      !chunks[0].chunkSource?.startsWith("github://"))
  )
    return nullResponse;
  try {
    const url = new URL(
      chunks[0].chunkSource.split("link://")[1] ||
      chunks[0].chunkSource.split("confluence://")[1] ||
      chunks[0].chunkSource.split("github://")[1]
    );
    let text = url.host + url.pathname;
    let icon = "link";

    if (url.host.includes("youtube.com")) {
      text = title;
      icon = "youtube";
    }

    if (url.host.includes("github.com")) {
      text = title;
      icon = "github";
    }

    if (url.host.includes("atlassian.net")) {
      text = title;
      icon = "confluence";
    }

    return {
      isUrl: true,
      href: url.toString(),
      text,
      icon,
    };
  } catch { }
  return nullResponse;
}

// Patch to render Confluence icon as a element like we do with Phosphor
const ConfluenceIcon = ({ ...props }) => (
  <img src={ConfluenceLogo} {...props} />
);

const ICONS = {
  file: FileText,
  link: Link,
  youtube: YoutubeLogo,
  github: GithubLogo,
  confluence: ConfluenceIcon,
};
