const films = [
  { title: 'Perfect Days', genre: 'Drama', rating: '8.1', runtime: '2h 04m', tag: 'Staff pick', format: '35MM · SUBTITLED', price: 16.5, image: 'photo-1470252649378-9c29740c9fa8', alt: 'Soft morning light over a quiet mountain landscape' },
  { title: 'Dune: Part Two', genre: 'Sci-Fi', rating: '8.8', runtime: '2h 46m', tag: 'Big screen', format: 'IMAX · DOLBY ATMOS', price: 21, image: 'photo-1462331940025-496dfbfc7564', alt: 'Deep space filled with stars and nebulae' },
  { title: 'Past Lives', genre: 'Drama', rating: '8.0', runtime: '1h 45m', tag: 'Almost sold out', format: '4K · ORIGINAL AUDIO', price: 16.5, image: 'photo-1470770841072-f978cf4d019e', alt: 'A still lake reflecting a mountain at dusk' },
  { title: 'The Grand Budapest Hotel', genre: 'Comedy', rating: '8.1', runtime: '1h 39m', tag: 'Audience fave', format: '35MM · ENGLISH', price: 15, image: 'photo-1511818966892-d7d671e672a2', alt: 'Ornate European architecture in warm daylight' },
  { title: 'Challengers', genre: 'Drama', rating: '7.2', runtime: '2h 11m', tag: 'New this week', format: '4K · DOLBY ATMOS', price: 18, image: 'photo-1518837695005-2083093ee35b', alt: 'Powerful ocean waves under a bright sky' },
  { title: 'The Quiet Room', genre: 'Thriller', rating: '7.9', runtime: '1h 52m', tag: 'One night only', format: '4K · ORIGINAL AUDIO', price: 17, image: 'photo-1519608487953-e999c86e7455', alt: 'A dramatic sky over a shadowed landscape' }
];

const movieGrid = document.querySelector('#movieGrid');
const overlay = document.querySelector('#bookingOverlay');
const toast = document.querySelector('#toast');
const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
let selectedFilm = null;
let selectedDate = 0;
let selectedTime = '';
let selectedSeats = [];
let toastTimer;

function renderFilms(filter = 'all', query = '') {
  const matchingFilms = films.filter((film) => {
    const matchesGenre = filter === 'all' || film.genre === filter;
    const matchesQuery = film.title.toLowerCase().includes(query.toLowerCase());
    return matchesGenre && matchesQuery;
  });

  movieGrid.innerHTML = matchingFilms.length ? matchingFilms.map((film, index) => {
    const originalIndex = films.indexOf(film);
    return `
      <article class="movie-card" style="animation-delay:${index * 55}ms">
        <div class="poster-wrap">
          <img class="poster-image" src="https://images.unsplash.com/${film.image}?auto=format&fit=crop&w=900&q=82" alt="${film.alt}" loading="lazy">
          <div class="poster-overlay"></div>
          <span class="poster-tag">${film.tag}</span>
          <span class="rating"><span>★</span>${film.rating}</span>
          <span class="poster-bottom">FRAME PRESENTS &nbsp;·&nbsp; ${film.genre.toUpperCase()}</span>
        </div>
        <div class="movie-info">
          <div><h3 class="movie-title">${film.title}</h3><p class="movie-meta">${film.genre} &nbsp;·&nbsp; ${film.runtime}</p></div>
          <span class="movie-price">FROM ${priceFormatter.format(film.price)}</span>
        </div>
        <div class="movie-actions"><span class="movie-format">${film.format}</span><button class="book-link" type="button" data-film="${originalIndex}">Book tickets <span aria-hidden="true">↗</span></button></div>
      </article>`;
  }).join('') : '<p class="empty-state">No films found. Try another title or genre.</p>';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2700);
}

function getDates() {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return { weekday: index === 0 ? 'TODAY' : weekday.format(date).toUpperCase(), day: date.getDate(), full: monthDay.format(date) };
  });
}

function renderDates() {
  document.querySelector('#dateOptions').innerHTML = getDates().map((date, index) => `
    <button class="date-option${index === selectedDate ? ' selected' : ''}" type="button" data-date="${index}">
      <span>${date.weekday}</span><span>${date.day}</span>
    </button>`).join('');
}

function renderSeats() {
  const seatGrid = document.querySelector('#seatGrid');
  const unavailable = new Set(['A4', 'A5', 'B2', 'B7', 'C3', 'C6', 'D1', 'D8']);
  const rows = ['A', 'B', 'C', 'D'];
  seatGrid.innerHTML = rows.map((row) => Array.from({ length: 8 }, (_, index) => {
    const seat = `${row}${index + 1}`;
    const taken = unavailable.has(seat);
    const selected = selectedSeats.includes(seat);
    return `<button class="seat${selected ? ' selected' : ''}" type="button" data-seat="${seat}" aria-label="Seat ${seat}${taken ? ', unavailable' : selected ? ', selected' : ', available'}" ${taken ? 'disabled' : ''}>${seat}</button>`;
  }).join('')).join('');
}

function updateBookingFooter() {
  const total = selectedSeats.length * (selectedFilm?.price ?? 0);
  document.querySelector('#bookingTotal').textContent = priceFormatter.format(total);
  const button = document.querySelector('#continueBooking');
  button.disabled = !selectedTime;
  if (!selectedTime) {
    button.innerHTML = 'Choose a time <span aria-hidden="true">→</span>';
  } else if (selectedSeats.length === 0) {
    button.innerHTML = 'Choose seats <span aria-hidden="true">↓</span>';
  } else {
    button.innerHTML = `Reserve ${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'} <span aria-hidden="true">→</span>`;
  }
  document.querySelector('#bookingStep').textContent = selectedSeats.length ? '03 / 03' : selectedTime ? '02 / 03' : '01 / 03';
}

function openBooking(film) {
  selectedFilm = film;
  selectedDate = 0;
  selectedTime = '';
  selectedSeats = [];
  document.querySelector('#bookingPoster').style.backgroundImage = `url("https://images.unsplash.com/${film.image}?auto=format&fit=crop&w=200&q=75")`;
  document.querySelector('#bookingGenre').textContent = `${film.genre.toUpperCase()} · ${film.rating} ★`;
  document.querySelector('#bookingTitle').textContent = film.title;
  document.querySelector('#bookingMeta').textContent = `${film.runtime}  ·  ${film.format.replaceAll('·', ' / ')}`;
  renderDates();
  renderSeats();
  document.querySelector('#seatSection').hidden = true;
  renderTimes();
  updateBookingFooter();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.querySelector('#closeBooking').focus();
}

function renderTimes() {
  const times = ['12:15 PM', '2:45 PM', '5:30 PM', '7:00 PM', '9:20 PM'];
  document.querySelector('#timeOptions').innerHTML = times.map((time, index) => `
    <button class="time-option${time === selectedTime ? ' selected' : ''}" type="button" data-time="${time}">${time}<small>${index === 2 ? 'FEW SEATS' : 'AVAILABLE'}</small></button>`).join('');
}

function closeBooking() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

renderFilms();

document.querySelectorAll('.filter-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelector('.filter-chip.selected')?.classList.remove('selected');
    chip.classList.add('selected');
    renderFilms(chip.dataset.filter);
  });
});

movieGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-film]');
  if (button) openBooking(films[Number(button.dataset.film)]);
});

document.querySelector('#dateOptions').addEventListener('click', (event) => {
  const button = event.target.closest('[data-date]');
  if (!button) return;
  selectedDate = Number(button.dataset.date);
  selectedTime = '';
  selectedSeats = [];
  renderDates();
  renderTimes();
  document.querySelector('#seatSection').hidden = true;
  updateBookingFooter();
});

document.querySelector('#timeOptions').addEventListener('click', (event) => {
  const button = event.target.closest('[data-time]');
  if (!button) return;
  selectedTime = button.dataset.time;
  selectedSeats = [];
  renderTimes();
  document.querySelector('#seatSection').hidden = false;
  updateBookingFooter();
});

document.querySelector('#seatGrid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-seat]');
  if (!button || button.disabled) return;
  const seat = button.dataset.seat;
  selectedSeats = selectedSeats.includes(seat) ? selectedSeats.filter((item) => item !== seat) : [...selectedSeats, seat];
  renderSeats();
  updateBookingFooter();
});

document.querySelector('#continueBooking').addEventListener('click', () => {
  if (!selectedTime) return;
  if (!selectedSeats.length) {
    document.querySelector('#seatSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Choose at least one seat to continue.');
    return;
  }
  const date = getDates()[selectedDate];
  showToast(`${selectedSeats.join(', ')} reserved for ${selectedFilm.title} · ${date.full}, ${selectedTime}`);
  closeBooking();
});

document.querySelector('#closeBooking').addEventListener('click', closeBooking);
overlay.addEventListener('click', (event) => { if (event.target === overlay) closeBooking(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && overlay.classList.contains('open')) closeBooking(); });

document.querySelector('.search-button').addEventListener('click', () => {
  const query = window.prompt('Find a film');
  if (query === null) return;
  document.querySelector('.filter-chip.selected')?.classList.remove('selected');
  document.querySelector('[data-filter="all"]').classList.add('selected');
  renderFilms('all', query.trim());
  document.querySelector('#films').scrollIntoView({ behavior: 'smooth' });
});

document.querySelector('#locationButton').addEventListener('click', () => showToast('Showing films near Brooklyn, NY.'));
document.querySelector('.avatar-button').addEventListener('click', () => showToast('Your FRAME account is ready for your next movie night.'));
