<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let editing = $state(false);
	let editFirstName = $state('');
	let editLastName = $state('');
	let editLocation = $state('');
	let editNotes = $state('');

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

	function renderHearts(rating: number): string {
		return '♥'.repeat(rating) + '♡'.repeat(5 - rating);
	}

	function getOtherContacts(contactNames: string[]): string {
		const others = contactNames.filter((name) => name !== data.contact.name);
		return others.length > 0 ? `with ${others.join(', ')}` : '';
	}

	function startEdit() {
		editFirstName = data.contact.firstName;
		editLastName = data.contact.lastName;
		editLocation = data.contact.location;
		editNotes = data.contact.notes;
		editing = true;
	}

	function cancelEdit() {
		editing = false;
	}

	async function saveEdit() {
		await fetch(`/api/contacts/${data.contact.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: editFirstName,
				lastName: editLastName,
				location: editLocation,
				notes: editNotes
			})
		});
		editing = false;
		await invalidateAll();
	}
</script>

<div class="container">
	<header class="header">
		<span class="username">{data.user.username}</span>
		<form action="/logout" method="POST">
			<button type="submit" class="logout-btn">Log out</button>
		</form>
	</header>

	<a href="/contacts" class="back-link">← All contacts</a>

	{#if editing}
		<div class="edit-form">
			<div class="edit-field">
				<label for="firstName">First name</label>
				<input id="firstName" type="text" bind:value={editFirstName} />
			</div>
			<div class="edit-field">
				<label for="lastName">Last name</label>
				<input id="lastName" type="text" bind:value={editLastName} />
			</div>
			<div class="edit-field">
				<label for="location">Location</label>
				<input id="location" type="text" bind:value={editLocation} placeholder="City, neighborhood, etc." />
			</div>
			<div class="edit-field">
				<label for="contactNotes">Notes</label>
				<textarea id="contactNotes" bind:value={editNotes} placeholder="Any notes about this person..."></textarea>
			</div>
			<div class="edit-actions">
				<button class="save-btn" onclick={saveEdit}>Save</button>
				<button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
			</div>
		</div>
	{:else}
		<div class="name-header">
			<h1>{data.contact.name}</h1>
			<button class="edit-btn" onclick={startEdit}>Edit</button>
		</div>
		{#if data.contact.location || data.contact.notes}
			<div class="contact-info">
				{#if data.contact.location}
					<p class="contact-location">{data.contact.location}</p>
				{/if}
				{#if data.contact.notes}
					<p class="contact-notes">{data.contact.notes}</p>
				{/if}
			</div>
		{/if}
	{/if}

	{#if data.interactions.length === 0}
		<p class="empty">No interactions logged yet.</p>
	{:else}
		<div class="interactions">
			{#each data.interactions as interaction}
				<div class="interaction">
					<div class="interaction-header">
						{#if interaction.rating > 0}
							<span class="hearts">{renderHearts(interaction.rating)}</span>
						{:else}
							<span></span>
						{/if}
						<span class="date">{formatDate(interaction.createdAt)}</span>
					</div>
					{#if interaction.contactNames.length > 1}
						<p class="with-others">{getOtherContacts(interaction.contactNames)}</p>
					{/if}
					{#if interaction.notes}
						<p class="notes">{interaction.notes}</p>
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

	.back-link {
		display: inline-block;
		margin-bottom: 16px;
		color: #007bff;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h1 {
		margin: 0;
	}

	.name-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.edit-btn {
		background: none;
		border: none;
		color: #007bff;
		cursor: pointer;
		font-size: 14px;
		padding: 0;
	}

	.edit-btn:hover {
		text-decoration: underline;
	}

	.edit-form {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.edit-field {
		margin-bottom: 16px;
	}

	.edit-field label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: #555;
		margin-bottom: 6px;
	}

	.edit-field input {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 15px;
		font-family: inherit;
	}

	.edit-field input:focus,
	.edit-field textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	.edit-field textarea {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 15px;
		font-family: inherit;
		min-height: 80px;
		resize: vertical;
	}

	.edit-actions {
		display: flex;
		gap: 8px;
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

	.contact-info {
		background: white;
		border-radius: 12px;
		padding: 16px 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.contact-location {
		color: #666;
		margin: 0 0 8px 0;
		font-size: 14px;
	}

	.contact-location::before {
		content: '📍 ';
	}

	.contact-notes {
		color: #555;
		margin: 0;
		line-height: 1.5;
		white-space: pre-wrap;
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

	.hearts {
		font-size: 20px;
		color: #e74c3c;
		letter-spacing: 2px;
	}

	.date {
		font-size: 13px;
		color: #888;
	}

	.with-others {
		font-size: 13px;
		color: #888;
		font-style: italic;
		margin: 0 0 8px 0;
	}

	.notes {
		color: #555;
		line-height: 1.5;
		margin: 0;
	}
</style>
