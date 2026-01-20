<script lang="ts">
	let { data } = $props();

	interface SelectedContact {
		name: string;
		isNew: boolean;
	}

	let rating = $state(0);
	let hoverRating = $state(0);
	let inputValue = $state('');
	let selectedContacts = $state<SelectedContact[]>([]);
	let notes = $state('');
	let suggestions = $state<{ id: number; name: string }[]>([]);
	let showSuggestions = $state(false);
	let currentInteractionIds = $state<number[]>([]);
	let saveStatus = $state('');
	let successMessage = $state('');
	let inputElement: HTMLInputElement;

	let saveTimeout: ReturnType<typeof setTimeout>;
	let searchTimeout: ReturnType<typeof setTimeout>;

	function setRating(value: number) {
		rating = value;
	}

	async function searchContacts(query: string) {
		if (!query.trim()) {
			suggestions = [];
			showSuggestions = false;
			return;
		}
		const res = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);
		suggestions = await res.json();
		showSuggestions = true;
	}

	function isExactMatch(query: string): boolean {
		return suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase());
	}

	function isAlreadySelected(name: string): boolean {
		return selectedContacts.some((c) => c.name.toLowerCase() === name.toLowerCase());
	}

	function handleContactInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		// Check for comma to add tag
		if (value.endsWith(',')) {
			const name = value.slice(0, -1).trim();
			if (name && !isAlreadySelected(name)) {
				const isNew = !isExactMatch(name);
				selectedContacts = [...selectedContacts, { name, isNew }];
			}
			inputValue = '';
			suggestions = [];
			showSuggestions = false;
			return;
		}

		inputValue = value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchContacts(value), 150);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Backspace' && inputValue === '' && selectedContacts.length > 0) {
			selectedContacts = selectedContacts.slice(0, -1);
		}
	}

	function selectContact(name: string, isNew: boolean) {
		if (!isAlreadySelected(name)) {
			selectedContacts = [...selectedContacts, { name, isNew }];
		}
		inputValue = '';
		suggestions = [];
		showSuggestions = false;
		inputElement?.focus();
	}

	function removeContact(index: number) {
		selectedContacts = selectedContacts.filter((_, i) => i !== index);
	}

	async function saveInteraction() {
		if (selectedContacts.length === 0) return;

		if (currentInteractionIds.length > 0) {
			// Update existing
			saveStatus = 'Saving...';
			await Promise.all(
				currentInteractionIds.map((id) =>
					fetch(`/api/interactions/${id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ rating, notes })
					})
				)
			);
			saveStatus = 'Saved';
		} else {
			// Create new for each contact
			saveStatus = 'Saving...';
			const results = await Promise.all(
				selectedContacts.map((contact) =>
					fetch('/api/interactions', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ contactName: contact.name, rating, notes })
					}).then((res) => res.json())
				)
			);
			saveStatus = '';
			const names = results.map((r) => r.contactName).join(', ');
			successMessage = `Logged interaction with ${names}`;
			setTimeout(() => (successMessage = ''), 3000);
			// Clear form
			rating = 0;
			inputValue = '';
			selectedContacts = [];
			notes = '';
		}
	}

	function handleNotesInput() {
		clearTimeout(saveTimeout);
		if (currentInteractionIds.length > 0) {
			saveStatus = 'Saving...';
			saveTimeout = setTimeout(async () => {
				await Promise.all(
					currentInteractionIds.map((id) =>
						fetch(`/api/interactions/${id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ notes })
						})
					)
				);
				saveStatus = 'Saved';
			}, 500);
		}
	}

	function resetForm() {
		rating = 0;
		inputValue = '';
		selectedContacts = [];
		notes = '';
		currentInteractionIds = [];
		saveStatus = '';
	}
</script>

<div class="container">
	<header class="header">
		<span class="username">{data.user.username}</span>
		<form action="/logout" method="POST">
			<button type="submit" class="logout-btn">Log out</button>
		</form>
	</header>

	<h1>Log Interaction</h1>

	<div class="form">
		<div class="section">
			<label for="notes">What happened?</label>
			<textarea
				id="notes"
				bind:value={notes}
				oninput={handleNotesInput}
				placeholder="Lunch at Sweetgreen, talked about funny health things..."
			></textarea>
			{#if saveStatus}
				<div class="save-status" class:saved={saveStatus === 'Saved'}>{saveStatus}</div>
			{/if}
		</div>

		<div class="section">
			<label for="contact">Who?</label>
			<div class="autocomplete">
				<div class="tags-input" onclick={() => inputElement?.focus()}>
					{#each selectedContacts as contact, i}
						<span class="tag">
							{contact.name}{#if contact.isNew} <span class="new-indicator">(new)</span>{/if}
							<button class="tag-remove" onclick={() => removeContact(i)}>&times;</button>
						</span>
					{/each}
					<input
						bind:this={inputElement}
						id="contact"
						type="text"
						value={inputValue}
						oninput={handleContactInput}
						onkeydown={handleKeydown}
						onfocus={() => inputValue && searchContacts(inputValue)}
						onblur={() => setTimeout(() => (showSuggestions = false), 200)}
						placeholder={selectedContacts.length === 0 ? 'Start typing a name...' : ''}
						autocomplete="off"
					/>
				</div>
				{#if showSuggestions}
					<div class="suggestions">
						{#each suggestions.filter((s) => !isAlreadySelected(s.name)) as contact}
							<button class="suggestion" onclick={() => selectContact(contact.name, false)}>
								{contact.name}
							</button>
						{/each}
						{#if inputValue.trim() && !isExactMatch(inputValue)}
							<button class="suggestion add-new" onclick={() => selectContact(inputValue.trim(), true)}>
								Add "{inputValue.trim()}" <span class="new-indicator">(new)</span>
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="section">
			<label>How was it? (optional)</label>
			<div class="stars">
				{#each [1, 2, 3, 4, 5] as star}
					<button
						class="star"
						class:active={star <= rating}
						class:hovered={star <= hoverRating}
						onmouseenter={() => (hoverRating = star)}
						onmouseleave={() => (hoverRating = 0)}
						onclick={() => setRating(star)}
					>
						♥
					</button>
				{/each}
			</div>
		</div>

		{#if currentInteractionIds.length > 0}
			<button class="new-btn" onclick={resetForm}>Log Another</button>
		{:else}
			<button
				class="submit-btn"
				onclick={saveInteraction}
				disabled={selectedContacts.length === 0}
			>
				Submit
			</button>
		{/if}
	</div>

	{#if successMessage}
		<div class="success">{successMessage}</div>
	{/if}

	<div class="nav-links">
		<a href="/contacts" class="contacts-link">View all contacts →</a>
		<a href="/interactions" class="contacts-link">View all interactions →</a>
	</div>
</div>

<style>
	.container {
		max-width: 500px;
		margin: 40px auto;
		padding: 20px;
		font-family: system-ui, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #eee;
	}

	.username {
		font-weight: 500;
		color: #333;
	}

	.logout-btn {
		background: none;
		border: none;
		color: #666;
		cursor: pointer;
		font-size: 14px;
	}

	.logout-btn:hover {
		color: #cc0000;
	}

	h1 {
		text-align: center;
		margin-bottom: 30px;
	}

	.form {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.section {
		margin-bottom: 24px;
	}

	.section:last-of-type {
		margin-bottom: 0;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #555;
	}

	.stars {
		display: flex;
		gap: 8px;
	}

	.star {
		background: none;
		border: none;
		font-size: 40px;
		cursor: pointer;
		color: #ddd;
		transition: color 0.15s, transform 0.15s;
		padding: 0;
	}

	.star:hover,
	.star.hovered {
		transform: scale(1.1);
		color: #ff6b6b;
	}

	.star.active {
		color: #e74c3c;
	}

	.autocomplete {
		position: relative;
	}

	.tags-input {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		min-height: 48px;
		cursor: text;
		transition: border-color 0.2s;
		align-items: center;
	}

	.tags-input:focus-within {
		border-color: #007bff;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: #e8f4ff;
		border-radius: 4px;
		font-size: 14px;
		color: #333;
	}

	.tag .new-indicator {
		color: #28a745;
		font-size: 12px;
	}

	.tag-remove {
		background: none;
		border: none;
		color: #666;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		padding: 0 2px;
		margin-left: 2px;
	}

	.tag-remove:hover {
		color: #cc0000;
	}

	.tags-input input {
		flex: 1;
		min-width: 120px;
		border: none;
		padding: 4px 0;
		font-size: 16px;
		font-family: inherit;
		outline: none;
	}

	textarea {
		width: 100%;
		padding: 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 16px;
		font-family: inherit;
		transition: border-color 0.2s;
		height: 3.5em;
		line-height: 1.5;
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 2px solid #e0e0e0;
		border-top: none;
		border-radius: 0 0 8px 8px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
	}

	.suggestion {
		display: block;
		width: 100%;
		padding: 10px 12px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 16px;
	}

	.suggestion:hover {
		background: #f0f7ff;
	}

	.suggestion.add-new {
		border-top: 1px solid #eee;
		color: #28a745;
	}

	.suggestion .new-indicator {
		color: #28a745;
		font-size: 13px;
	}

	.save-status {
		margin-top: 8px;
		font-size: 13px;
		color: #888;
	}

	.save-status.saved {
		color: #28a745;
	}

	.success {
		margin-top: 20px;
		padding: 16px;
		background: #d4edda;
		color: #155724;
		border-radius: 8px;
		text-align: center;
	}

	.new-btn {
		margin-top: 16px;
		width: 100%;
		padding: 12px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
	}

	.new-btn:hover {
		background: #0056b3;
	}

	.submit-btn {
		margin-top: 16px;
		width: 100%;
		padding: 12px;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
	}

	.submit-btn:hover:not(:disabled) {
		background: #218838;
	}

	.submit-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.nav-links {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 24px;
	}

	.contacts-link {
		display: block;
		text-align: center;
		color: #007bff;
		text-decoration: none;
	}

	.contacts-link:hover {
		text-decoration: underline;
	}
</style>
