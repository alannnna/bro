<script lang="ts">
	import { goto } from '$app/navigation';
	import NavBar from '$lib/components/NavBar.svelte';

	let { data } = $props();

	let firstName = $state('');
	let lastName = $state('');
	let location = $state('');
	let notes = $state('');
	let saving = $state(false);
	let error = $state('');

	async function saveContact() {
		if (!firstName.trim()) {
			error = 'First name is required';
			return;
		}

		saving = true;
		error = '';

		const res = await fetch('/api/contacts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				location: location.trim(),
				notes: notes.trim()
			})
		});

		if (res.ok) {
			const contact = await res.json();
			goto(`/contacts/${contact.id}`);
		} else {
			const result = await res.json();
			error = result.error || 'Failed to create contact';
			saving = false;
		}
	}
</script>

<div class="container">
	<NavBar username={data.user.username} />

	<h1>Add Contact</h1>

	<div class="form">
		{#if error}
			<div class="error">{error}</div>
		{/if}

		<div class="field">
			<label for="firstName">First name</label>
			<input id="firstName" type="text" bind:value={firstName} />
		</div>

		<div class="field">
			<label for="lastName">Last name</label>
			<input id="lastName" type="text" bind:value={lastName} />
		</div>

		<div class="field">
			<label for="location">Location</label>
			<input id="location" type="text" bind:value={location} placeholder="City, neighborhood, etc." />
		</div>

		<div class="field">
			<label for="notes">Notes</label>
			<textarea id="notes" bind:value={notes} placeholder="Any notes about this person..."></textarea>
		</div>

		<button class="save-btn" onclick={saveContact} disabled={saving}>
			{saving ? 'Saving...' : 'Add Contact'}
		</button>
	</div>
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

	.form {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.error {
		background: #ffe6e6;
		color: #cc0000;
		padding: 12px;
		border-radius: 6px;
		margin-bottom: 16px;
	}

	.field {
		margin-bottom: 16px;
	}

	.field label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: #555;
		margin-bottom: 6px;
	}

	.field input,
	.field textarea {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 15px;
		font-family: inherit;
	}

	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	.field textarea {
		min-height: 80px;
		resize: vertical;
	}

	.save-btn {
		width: 100%;
		padding: 12px;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
		margin-top: 8px;
	}

	.save-btn:hover:not(:disabled) {
		background: #218838;
	}

	.save-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
</style>
