import type { MovieMetadata } from '../types/Movie';
import './HomePage.css';

interface HomePageProps {
  movies: MovieMetadata[];
  onSelectMovie: (movieId: string) => void;
}

export const HomePage = ({ movies, onSelectMovie }: HomePageProps) => {
  return (
    <main className="home-main">
      <section className="home-panel">
        <p className="home-kicker">Study Evangelion through script pages</p>
        <h1 className="home-title">ヱヴァンゲリヲン新劇場版 台本</h1>
        <p className="home-copy">
          Choose a movie to open the Japanese transcript with furigana and English translation.
        </p>

        <div className="movie-grid">
          {movies.map((movie) => (
            <button
              key={movie.id}
              className="movie-card"
              onClick={() => onSelectMovie(movie.id)}
            >
              <span className="movie-card-ja">{movie.titleJa}</span>
              <span className="movie-card-en">{movie.titleEn}</span>
              <span className="movie-card-parts">{movie.totalParts} parts</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};
