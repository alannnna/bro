<script lang="ts">
	import ContactTagInput from '$lib/components/ContactTagInput.svelte';
	import NavBar from '$lib/components/NavBar.svelte';

	let { data } = $props();

	interface SelectedContact {
		name: string;
		isNew: boolean;
	}

	let rating = $state(0);
	let hoverRating = $state(0);
	let selectedContacts = $state<SelectedContact[]>([]);
	let notes = $state('');
	let currentInteractionId = $state<number | null>(null);
	let saveStatus = $state('');
	let successMessage = $state('');
	let selectedDayOffset = $state(0); // 0 = today, 1 = yesterday, etc.
	let datePickerExpanded = $state(false);

	function getDayLabel(offset: number): string {
		if (offset === 0) return 'today';
		if (offset === 1) return 'yesterday';
		const date = new Date();
		date.setDate(date.getDate() - offset);
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function getTimestampForOffset(offset: number): string | undefined {
		if (offset === 0) return undefined; // Use server default for today
		const date = new Date();
		date.setDate(date.getDate() - offset);
		date.setHours(12, 0, 0, 0); // Noon
		return date.toISOString();
	}

	function selectDay(offset: number) {
		selectedDayOffset = offset;
		datePickerExpanded = false;
	}

	let saveTimeout: ReturnType<typeof setTimeout>;

	function setRating(value: number) {
		rating = value;
	}

	async function saveInteraction() {
		if (selectedContacts.length === 0) return;

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
			// Create new interaction with all contacts
			saveStatus = 'Saving...';
			const contactNames = selectedContacts.map((c) => c.name);
			const timestamp = getTimestampForOffset(selectedDayOffset);
			const res = await fetch('/api/interactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contactNames, rating, notes, timestamp })
			});
			const result = await res.json();
			saveStatus = '';
			const names = result.contactNames.join(', ');
			successMessage = `Logged interaction with ${names}`;
			setTimeout(() => (successMessage = ''), 3000);
			// Clear form
			rating = 0;
			selectedContacts = [];
			notes = '';
			selectedDayOffset = 0;
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
		selectedContacts = [];
		notes = '';
		currentInteractionId = null;
		saveStatus = '';
		selectedDayOffset = 0;
		datePickerExpanded = false;
	}
</script>

<div class="container">
	<NavBar username={data.user.username} />

	<h1>Log Interaction</h1>

	<div class="form">
		<div class="section">
			<label for="notes">What happened?</label>
			<textarea
				id="notes"
				bind:value={notes}
				oninput={handleNotesInput}
				placeholder="Interaction notes, e.g. chatted about bands at Frank's party, got pizza at L'Industrie"
			></textarea>
			{#if saveStatus}
				<div class="save-status" class:saved={saveStatus === 'Saved'}>{saveStatus}</div>
			{/if}
		</div>

		<div class="section">
			<label>Who?</label>
			<ContactTagInput bind:selectedContacts />
		</div>

		<div class="section">
			<label>When?</label>
			<button class="date-toggle" onclick={() => (datePickerExpanded = !datePickerExpanded)}>
				{getDayLabel(selectedDayOffset)}
			</button>
			{#if datePickerExpanded}
				<div class="date-picker">
					{#each [0, 1, 2, 3, 4, 5, 6, 7] as offset}
						<button
							class="date-option"
							class:selected={selectedDayOffset === offset}
							onclick={() => selectDay(offset)}
						>
							{getDayLabel(offset)}
						</button>
					{/each}
				</div>
			{/if}
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
				disabled={selectedContacts.length === 0}
			>
				Submit
			</button>
		{/if}
	</div>

	{#if successMessage}
		<a href="/interactions" class="success">{successMessage}</a>
	{/if}
</div>

<style>
	.container {
		max-width: 500px;
		margin: 40px auto;
		padding: 20px;
		font-family: system-ui, sans-serif;
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

	.save-status {
		margin-top: 8px;
		font-size: 13px;
		color: #888;
	}

	.save-status.saved {
		color: #28a745;
	}

	.success {
		display: block;
		margin-top: 20px;
		padding: 16px;
		background: #d4edda;
		color: #155724;
		border-radius: 8px;
		text-align: center;
		text-decoration: none;
	}

	.success:hover {
		background: #c3e6cb;
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

	.date-toggle {
		background: none;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 14px;
		color: #007bff;
		cursor: pointer;
		transition: border-color 0.2s, background-color 0.2s;
	}

	.date-toggle:hover {
		border-color: #007bff;
		background: #f0f7ff;
	}

	.date-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
		padding: 12px;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.date-option {
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.date-option:hover {
		border-color: #007bff;
		background: #f0f7ff;
	}

	.date-option.selected {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}
</style>
