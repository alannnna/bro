<script lang="ts">
	let { data } = $props();

	let rating = $state(0);
	let hoverRating = $state(0);
	let contactName = $state('');
	let notes = $state('');
	let suggestions = $state<{ id: number; name: string }[]>([]);
	let showSuggestions = $state(false);
	let currentInteractionId = $state<number | null>(null);
	let saveStatus = $state('');
	let successMessage = $state('');

	let saveTimeout: ReturnType<typeof setTimeout>;
	let searchTimeout: ReturnType<typeof setTimeout>;

	function setRating(value: number) {
		rating = value;
	}

	async function searchContacts(query: string) {
		if (!query.trim()) {
			suggestions = [];
			return;
		}
		const res = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);
		suggestions = await res.json();
		showSuggestions = suggestions.length > 0;
	}

	function handleContactInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		contactName = value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchContacts(value), 150);
	}

	function selectContact(name: string) {
		contactName = name;
		showSuggestions = false;
	}

	async function saveInteraction() {
		if (!contactName.trim()) return;

		if (currentInteractionId) {
			// Update existing
			saveStatus = 'Saving...';
			await fetch(`/api/interactions/${currentInteractionId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rating, notes })
			});
			saveStatus = 'Saved';
		} else {
			// Create new
			saveStatus = 'Saving...';
			const res = await fetch('/api/interactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contactName, rating, notes })
			});
			const data = await res.json();
			currentInteractionId = data.id;
			saveStatus = 'Saved';
			successMessage = `Logged interaction with ${data.contactName}`;
			setTimeout(() => (successMessage = ''), 3000);
		}
	}

	function handleNotesInput() {
		clearTimeout(saveTimeout);
		if (currentInteractionId) {
			saveStatus = 'Saving...';
			saveTimeout = setTimeout(async () => {
				await fetch(`/api/interactions/${currentInteractionId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ notes })
				});
				saveStatus = 'Saved';
			}, 500);
		}
	}

	function resetForm() {
		rating = 0;
		contactName = '';
		notes = '';
		currentInteractionId = null;
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
				<input
					id="contact"
					type="text"
					value={contactName}
					oninput={handleContactInput}
					onfocus={() => contactName && searchContacts(contactName)}
					onblur={() => setTimeout(() => (showSuggestions = false), 200)}
					placeholder="Start typing a name..."
					autocomplete="off"
				/>
				{#if showSuggestions}
					<div class="suggestions">
						{#each suggestions as contact}
							<button class="suggestion" onclick={() => selectContact(contact.name)}>
								{contact.name}
							</button>
						{/each}
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

		{#if currentInteractionId}
			<button class="new-btn" onclick={resetForm}>Log Another</button>
		{:else}
			<button
				class="submit-btn"
				onclick={saveInteraction}
				disabled={!contactName.trim()}
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

	input,
	textarea {
		width: 100%;
		padding: 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 16px;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	textarea {
		min-height: 100px;
		resize: vertical;
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
