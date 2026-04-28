<script lang="ts">
  import cards from '$lib/data/cards.json';
  import { evaluateGuess, displayCost, displayKeywords } from '$lib/utils/game';
  import type { Card, GuessResult } from '$lib/utils/game';

  const allCards = cards as Card[];

  // Daily card — deterministic based on date
  function getDailyCard(): Card {
    const epoch = new Date('2025-01-01').getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayIndex = Math.floor((today.getTime() - epoch) / 86400000);
    return allCards[dayIndex % allCards.length];
  }

  const target = getDailyCard();

  let guess: Card | null = null;
  let guesses: GuessResult[] = [];
  let gameOver = false;
  let searchText = '';
  let showDropdown = false;

  const MAX_GUESSES = 6;

  $: remaining = MAX_GUESSES - guesses.length;
  $: won = guesses.length > 0 && guesses[guesses.length - 1].fields.name === 'correct';

  $: matches = searchText.length > 0
    ? allCards
        .filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()))
        .slice(0, 8)
    : [];

  function selectCard(card: Card) {
    guess = card;
    searchText = card.name;
    showDropdown = false;
  }

  function submitGuess() {
    if (!guess || gameOver || guesses.length >= MAX_GUESSES) return;
    const result = evaluateGuess(guess, target);
    guesses = [...guesses, result];
    if (result.fields.name === 'correct' || guesses.length >= MAX_GUESSES) {
      gameOver = true;
    }
    guess = null;
    searchText = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submitGuess();
  }

  function getFieldValue(card: Card, key: keyof GuessResult['fields']): string {
    switch (key) {
      case 'name':     return card.name;
      case 'color':    return card.color.charAt(0).toUpperCase() + card.color.slice(1);
      case 'type':     return card.type;
      case 'cost':     return displayCost(card);
      case 'rarity':   return card.rarity;
      case 'keywords': return displayKeywords(card);
    }
  }

  const FIELDS: { key: keyof GuessResult['fields']; label: string }[] = [
    { key: 'name',     label: 'Card' },
    { key: 'color',    label: 'Character' },
    { key: 'type',     label: 'Type' },
    { key: 'cost',     label: 'Cost' },
    { key: 'rarity',   label: 'Rarity' },
    { key: 'keywords', label: 'Keywords' },
  ];
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="page">
  <!-- Header -->
  <header>
    <div class="logo-wrap">
      <span class="logo-icon">✦</span>
      <h1>Spiredle</h1>
      <span class="logo-icon">✦</span>
    </div>
    <p class="subtitle">Guess the card of the day in 6 tries or less</p>
    <div class="divider"></div>
  </header>

  <!-- Column labels (shown once guesses exist) -->
  {#if guesses.length > 0}
    <div class="col-labels">
      {#each FIELDS as field}
        <div class="col-label">{field.label}</div>
      {/each}
    </div>
  {/if}

  <!-- Guess rows -->
  {#if guesses.length > 0}
    <div class="guesses">
      {#each guesses as result}
        <div class="guess-row">
          {#each FIELDS as field}
            <div class="cell {result.fields[field.key]}">
              <span class="cell-text">{getFieldValue(result.card, field.key)}</span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Game over message -->
  {#if gameOver}
    <div class="result-banner" class:won class:lost={!won}>
      {#if won}
        <span class="result-icon">✦</span>
        <span>Got it in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!</span>
        <span class="result-icon">✦</span>
      {:else}
        <span>The card was <strong>{target.name}</strong>. Better luck tomorrow!</span>
      {/if}
    </div>
  {/if}

  <!-- Input area -->
  {#if !gameOver}
    <div class="input-area">
      <div class="search-wrap">
        <input
          type="text"
          placeholder="Search for a card..."
          bind:value={searchText}
          on:focus={() => showDropdown = true}
          on:blur={() => setTimeout(() => showDropdown = false, 150)}
          autocomplete="off"
          spellcheck="false"
        />
        {#if showDropdown && matches.length > 0}
          <ul class="dropdown">
            {#each matches as card}
              <li>
                <button on:mousedown={() => selectCard(card)}>
                  <span class="card-name">{card.name}</span>
                  <span class="card-hint">{card.color.charAt(0).toUpperCase() + card.color.slice(1)} · {card.type} · {card.rarity}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <button
        class="submit-btn"
        on:click={submitGuess}
        disabled={!guess}
      >
        Submit Guess
      </button>

      <p class="remaining">
        {remaining} {remaining === 1 ? 'guess' : 'guesses'} remaining
      </p>
    </div>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:wght@300;400;500&display=swap');

  :global(body) {
    margin: 0;
    background: #0e0e12;
    color: #e8e0d0;
    min-height: 100vh;
  }

  .page {
    max-width: 820px;
    margin: 0 auto;
    padding: 2.5rem 1rem 4rem;
    font-family: 'Crimson Pro', Georgia, serif;
  }

  /* ── Header ── */
  header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  h1 {
    font-family: 'Cinzel', serif;
    font-size: clamp(2.2rem, 6vw, 3.5rem);
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #c9a84c;
    margin: 0;
    text-shadow: 0 0 40px rgba(201,168,76,0.3);
  }

  .logo-icon {
    color: #c9a84c;
    font-size: 1.2rem;
    opacity: 0.7;
  }

  .subtitle {
    font-family: 'Crimson Pro', serif;
    font-size: 1.05rem;
    color: #8a7e6e;
    letter-spacing: 0.04em;
    margin: 0 0 1.25rem;
    font-style: italic;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c55, transparent);
    margin: 0 auto;
    max-width: 400px;
  }

  /* ── Column labels ── */
  .col-labels {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin-bottom: 6px;
    padding: 0 2px;
  }

  .col-label {
    text-align: center;
    font-family: 'Cinzel', serif;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #5a5040;
    text-transform: uppercase;
  }

  /* ── Guess rows ── */
  .guesses {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 1.5rem;
  }

  .guess-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 0.3rem;
    border-radius: 4px;
    text-align: center;
    font-family: 'Crimson Pro', serif;
    font-size: 0.82rem;
    font-weight: 500;
    word-break: break-word;
    line-height: 1.2;
    min-height: 52px;
    border: 1px solid transparent;
    animation: flipIn 0.35s ease both;
  }

  @keyframes flipIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .cell.correct {
    background: #1a3a24;
    border-color: #2d6b3d;
    color: #6fcf8a;
  }

  .cell.wrong {
    background: #1a1a20;
    border-color: #2e2e38;
    color: #5a5468;
  }

  .cell-text {
    display: block;
  }

  /* ── Result banner ── */
  .result-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 6px;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .result-banner.won {
    background: #1a3a24;
    border: 1px solid #2d6b3d;
    color: #6fcf8a;
  }

  .result-banner.lost {
    background: #2a1a1a;
    border: 1px solid #5c2c2c;
    color: #b07070;
  }

  .result-icon {
    opacity: 0.6;
    font-size: 0.75rem;
  }

  /* ── Input area ── */
  .input-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .search-wrap {
    position: relative;
    width: 100%;
    max-width: 480px;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.75rem 1rem;
    font-family: 'Crimson Pro', serif;
    font-size: 1rem;
    background: #16161e;
    border: 1px solid #2e2e3a;
    border-radius: 6px;
    color: #e8e0d0;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  input[type="text"]::placeholder {
    color: #3e3a50;
  }

  input[type="text"]:focus {
    border-color: #c9a84c66;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.07);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #16161e;
    border: 1px solid #2e2e3a;
    border-radius: 6px;
    list-style: none;
    padding: 4px 0;
    margin: 0;
    max-height: 260px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  .dropdown li button {
    width: 100%;
    text-align: left;
    padding: 0.55rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    color: inherit;
  }

  .dropdown li button:hover {
    background: #1e1e28;
  }

  .card-name {
    font-family: 'Crimson Pro', serif;
    font-size: 0.95rem;
    color: #e8e0d0;
  }

  .card-hint {
    font-family: 'Crimson Pro', serif;
    font-size: 0.78rem;
    color: #4a4460;
    white-space: nowrap;
    font-style: italic;
  }

  .submit-btn {
    padding: 0.7rem 2rem;
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    background: #c9a84c;
    color: #0e0e12;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }

  .submit-btn:hover:not(:disabled) {
    background: #d9bb6a;
    transform: translateY(-1px);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .remaining {
    font-family: 'Crimson Pro', serif;
    font-size: 0.9rem;
    font-style: italic;
    color: #4a4460;
    margin: 0;
  }
</style>