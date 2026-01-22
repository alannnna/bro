<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ContactTagInput from '$lib/components/ContactTagInput.svelte';
	import NavBar from '$lib/components/NavBar.svelte';

	let { data } = $props();

	interface SelectedContact {
		name: string;
		isNew: boolean;
	}

	let editingId = $state<number | null>(null);
	let editContacts = $state<SelectedContact[]>([]);
	let editNotes = $state('');
	let editRating = $state(0);
	let hoverRating = $state(0);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function renderHearts(rating: number | null): string {
		if (!rating) return '';
		return '♥'.repeat(rating) + '♡'.repeat(5 - rating);
	}

	function startEdit(interaction: typeof data.interactions[0]) {
		editingId = interaction.id;
		editContacts = interaction.contactNames.map((name) => ({ name, isNew: false }));
		editNotes = interaction.notes;
		editRating = interaction.rating || 0;
	}

	function cancelEdit() {
		editingId = null;
		editContacts = [];
		editNotes = '';
		editRating = 0;
	}

	async function saveEdit() {
		if (!editingId || editContacts.length === 0) return;

		const contactNames = editContacts.map((c) => c.name);
		await fetch(`/api/interactions/${editingId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contactNames,
				notes: editNotes,
				rating: editRating || null
			})
		});

		editingId = null;
		await invalidateAll();
	}

	async function deleteInteraction() {
		if (!editingId) return;
		if (!confirm('Delete this interaction?')) return;

		await fetch(`/api/interactions/${editingId}`, {
			method: 'DELETE'
		});

		editingId = null;
		await invalidateAll();
	}

	function setEditRating(value: number) {
		editRating = editRating === value ? 0 : value;
	}
</script>

<div class="container">
	<NavBar username={data.user.username} />

	<h1>All Interactions</h1>

	<div class="stats-box">
		<h2>Positive Interactions</h2>
		<div class="stats-grid">
			<div class="stat">
				<span class="stat-value">{data.stats.positiveToday}</span>
				<span class="stat-label">Today</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.stats.positiveThisWeek}</span>
				<span class="stat-label">This Week</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.stats.positiveThisMonth}</span>
				<span class="stat-label">This Month</span>
			</div>
		</div>
	</div>

	{#if data.interactions.length === 0}
		<p class="empty">No interactions logged yet.</p>
	{:else}
		<div class="interactions">
			{#each data.interactions as interaction}
				<div class="interaction">
					{#if editingId === interaction.id}
						<div class="edit-form">
							<div class="edit-field">
								<label>Who</label>
								<ContactTagInput bind:selectedContacts={editContacts} />
							</div>
							<div class="edit-field">
								<label>Notes</label>
								<textarea bind:value={editNotes}></textarea>
							</div>
							<div class="edit-field">
								<label>Rating</label>
								<div class="stars">
									{#each [1, 2, 3, 4, 5] as star}
										<button
											class="star"
											class:active={star <= editRating}
											class:hovered={star <= hoverRating}
											onmouseenter={() => (hoverRating = star)}
											onmouseleave={() => (hoverRating = 0)}
											onclick={() => setEditRating(star)}
										>
											♥
										</button>
									{/each}
								</div>
							</div>
							<div class="edit-actions">
								<button class="save-btn" onclick={saveEdit}>Save</button>
								<button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
								<button class="delete-btn" onclick={deleteInteraction}>Delete</button>
							</div>
						</div>
					{:else}
						<div class="interaction-header">
							<span class="contact-name">{interaction.contactNames.join(', ')}</span>
							<div class="header-right">
								<span class="date">{formatDate(interaction.createdAt)}</span>
								<button class="edit-btn" onclick={() => startEdit(interaction)}>Edit</button>
							</div>
						</div>
						{#if interaction.rating && interaction.rating > 0}
							<div class="hearts">{renderHearts(interaction.rating)}</div>
						{/if}
						{#if interaction.notes}
							<p class="notes">{interaction.notes}</p>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
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
		margin-bottom: 24px;
	}

	.stats-box {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.stats-box h2 {
		font-size: 14px;
		color: #666;
		margin: 0 0 16px 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 600;
		color: #28a745;
	}

	.stat-label {
		font-size: 13px;
		color: #888;
		margin-top: 4px;
	}

	.empty {
		color: #666;
		text-align: center;
		padding: 40px 20px;
	}

	.interactions {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.interaction {
		background: white;
		border-radius: 12px;
		padding: 16px 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.interaction-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.contact-name {
		font-weight: 600;
		color: #333;
	}

	.date {
		font-size: 13px;
		color: #888;
	}

	.edit-btn {
		background: none;
		border: none;
		color: #007bff;
		cursor: pointer;
		font-size: 13px;
		padding: 0;
	}

	.edit-btn:hover {
		text-decoration: underline;
	}

	.hearts {
		font-size: 18px;
		color: #e74c3c;
		letter-spacing: 2px;
		margin-bottom: 8px;
	}

	.notes {
		color: #555;
		line-height: 1.5;
		margin: 0;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.edit-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.edit-field label {
		font-size: 13px;
		font-weight: 500;
		color: #555;
	}

	.edit-field textarea {
		padding: 10px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 15px;
		font-family: inherit;
		min-height: 80px;
		resize: vertical;
	}

	.edit-field textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	.stars {
		display: flex;
		gap: 4px;
	}

	.star {
		background: none;
		border: none;
		font-size: 28px;
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

	.edit-actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.save-btn {
		padding: 8px 16px;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.save-btn:hover {
		background: #218838;
	}

	.cancel-btn {
		padding: 8px 16px;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.cancel-btn:hover {
		background: #5a6268;
	}

	.delete-btn {
		padding: 8px 16px;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		margin-left: auto;
	}

	.delete-btn:hover {
		background: #c82333;
	}
</style>
