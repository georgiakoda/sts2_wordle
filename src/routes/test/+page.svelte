<script lang="ts">
  import cards from '$lib/data/cards.json';
  import { evaluateGuess, displayCost, displayKeywords } from '$lib/utils/game';
  import type { Card, GuessResult } from '$lib/utils/game';

  const allCards = cards as Card[];

  let target: Card | null = null;
  let guess: Card | null = null;
  let guesses: GuessResult[] = [];
  let gameOver = false;

  const MAX_GUESSES = 6;

  // Search state
  let targetSearch = '';
  let guessSearch = '';
  let showTargetDropdown = false;
  let showGuessDropdown = false;

  $: targetMatches = targetSearch.length > 0
    ? allCards.filter(c => c.name.toLowerCase().includes(targetSearch.toLowerCase())).slice(0, 10)
    : [];

  $: guessMatches = guessSearch.length > 0
    ? allCards.filter(c => c.name.toLowerCase().includes(guessSearch.toLowerCase())).slice(0, 10)
    : [];

  function selectTarget(card: Card) {
    target = card;
    targetSearch = card.name;
    showTargetDropdown = false;
    guesses = [];
    gameOver = false;
    guess = null;
    guessSearch = '';
  }

  function selectGuess(card: Card) {
    guess = card;
    guessSearch = card.name;
    showGuessDropdown = false;
  }

  function submitGuess() {
    if (!target || !guess || gameOver || guesses.length >= MAX_GUESSES) return;
    const result = evaluateGuess(guess, target);
    guesses = [...guesses, result];
    if (result.fields.name === 'correct' || guesses.length >= MAX_GUESSES) {
      gameOver = true;
    }
    guess = null;
    guessSearch = '';
  }

  function reset() {
    guesses = [];
    gameOver = false;
    guess = null;
    guessSearch = '';
  }

  $: won = guesses.length > 0 && guesses[guesses.length - 1].fields.name === 'correct';

  const FIELDS: { key: keyof GuessResult['fields']; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'color', label: 'Character' },
    { key: 'type', label: 'Type' },
    { key: 'cost', label: 'Cost' },
    { key: 'rarity', label: 'Rarity' },
    { key: 'keywords', label: 'Keywords' },
  ];

  function getFieldValue(card: Card, key: keyof GuessResult['fields']): string {
    switch (key) {
      case 'name': return card.name;
      case 'color': return card.color.charAt(0).toUpperCase() + card.color.slice(1);
      case 'type': return card.type;
      case 'cost': return displayCost(card);
      case 'rarity': return card.rarity;
      case 'keywords': return displayKeywords(card);
    }
  }
</script>

<div class="page">
  <h1>Test Mode</h1>
  <p class="subtitle">test comparison logic</p>

  <div class="selectors">
    <div class="selector-group">
      <label for="target-input">Card of the day (target)</label>
      <div class="search-wrap">
        <input
          id="target-input"
          type="text"
          placeholder="Search for target card..."
          bind:value={targetSearch}
          on:focus={() => showTargetDropdown = true}
          on:blur={() => setTimeout(() => showTargetDropdown = false, 150)}
          autocomplete="off"
        />
        {#if showTargetDropdown && targetMatches.length > 0}
          <ul class="dropdown">
            {#each targetMatches as card}
              <li>
                <button on:mousedown={() => selectTarget(card)}>
                  {card.name}
                  <span class="card-meta">{card.color} · {card.type} · {card.rarity}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      {#if target}
        <p class="selected-hint">Target: <strong>{target.name}</strong></p>
      {/if}
    </div>

    <div class="selector-group">
      <label for="guess-input">Your guess</label>
      <div class="search-wrap">
        <input
          id="guess-input"
          type="text"
          placeholder="Search for a card to guess..."
          bind:value={guessSearch}
          on:focus={() => showGuessDropdown = true}
          on:blur={() => setTimeout(() => showGuessDropdown = false, 150)}
          disabled={!target || gameOver}
          autocomplete="off"
        />
        {#if showGuessDropdown && guessMatches.length > 0}
          <ul class="dropdown">
            {#each guessMatches as card}
              <li>
                <button on:mousedown={() => selectGuess(card)}>
                  {card.name}
                  <span class="card-meta">{card.color} · {card.type} · {card.rarity}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>

  <div class="actions">
    <button
      class="btn-submit"
      on:click={submitGuess}
      disabled={!target || !guess || gameOver || guesses.length >= MAX_GUESSES}
    >
      Submit Guess ({guesses.length}/{MAX_GUESSES})
    </button>
    {#if guesses.length > 0}
      <button class="btn-reset" on:click={reset}>Reset</button>
    {/if}
  </div>

  {#if guesses.length > 0}
    <div class="guesses">
      <div class="guess-header">
        {#each FIELDS as field}
          <div class="header-cell">{field.label}</div>
        {/each}
      </div>

      {#each guesses as result, i}
        <div class="guess-row">
          {#each FIELDS as field}
            <div class="cell {result.fields[field.key]}">
              {getFieldValue(result.card, field.key)}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  {#if gameOver}
    <div class="game-over">
      {#if won}
        <p class="won">✓ Correct! Got it in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}.</p>
      {:else}
        <p class="lost">Out of guesses. The card was <strong>{target?.name}</strong>.</p>
      {/if}
      <button class="btn-reset" on:click={reset}>Play again</button>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: sans-serif;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .subtitle {
    color: #666;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .selectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .selector-group label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #555;
    margin-bottom: 0.4rem;
  }

  .search-wrap {
    position: relative;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    outline: none;
  }

  input[type="text"]:focus {
    border-color: #888;
  }

  input:disabled {
    background: #f5f5f5;
    color: #aaa;
    cursor: not-allowed;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 6px;
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 220px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .dropdown li button {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    color: inherit;
  }

  .dropdown li button:hover {
    background: #f5f5f5;
  }

  .card-meta {
    font-size: 0.75rem;
    color: #888;
    white-space: nowrap;
  }

  .selected-hint {
    font-size: 0.8rem;
    color: #555;
    margin-top: 0.4rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .btn-submit {
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-submit:not(:disabled):hover {
    background: #333;
  }

  .btn-reset {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: none;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
    color: #555;
  }

  .btn-reset:hover {
    background: #f5f5f5;
  }

  .guesses {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .guess-header {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin-bottom: 2px;
  }

  .header-cell {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
    text-align: center;
  }

  .guess-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .cell {
    padding: 0.6rem 0.25rem;
    border-radius: 6px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 500;
    word-break: break-word;
    transition: background 0.2s;
  }

  .cell.correct {
    background: #22863a;
    color: white;
  }

  .cell.wrong {
    background: #3a3a3a;
    color: #ccc;
  }

  .game-over {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 8px;
    background: #f9f9f9;
    border: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .won {
    color: #22863a;
    font-weight: 600;
  }

  .lost {
    color: #555;
  }
</style>
