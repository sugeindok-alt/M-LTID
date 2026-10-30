export default function Loading() {
  return (
    <div className="container page-shell" aria-busy="true" aria-label="Lastar inn">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="recipe-grid">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="skeleton skeleton-photo" />
            <div className="skeleton skeleton-text" />
          </div>
        ))}
      </div>
      <span className="sr-only">Lastar inn innhaldet …</span>
    </div>
  );
}
