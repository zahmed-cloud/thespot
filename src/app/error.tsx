"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="return-page">
      <h1>something broke on our side.</h1>
      <p className="return-sub">
        the board is fine and no money moved. try again in a second.
      </p>
      <button className="btn return-btn" onClick={reset}>
        try again
      </button>
    </div>
  );
}
