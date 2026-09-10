function LoadingBar({ progress }) {
    const percent = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

 return (
    <div className="loading-bar">
      <div className="loading-bar__label">
        {progress
          ? `Fetching words… ${percent}% (${progress.completed} / ${progress.total})`
          : "Starting… the first run can take a few minutes"}
      </div>

      <div
        className="loading-bar__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="loading-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
 );
}

export default LoadingBar;