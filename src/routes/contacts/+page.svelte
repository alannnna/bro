<script lang="ts">
	import NavBar from '$lib/components/NavBar.svelte';

	let { data } = $props();
	let sortBy = $state<'recent' | 'added' | 'firstName' | 'lastName' | 'noLastName'>('recent');
	let search = $state('');

	const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
	const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

	let sortedContacts = $derived(() => {
		let contacts = [...data.contacts];

		// Filter by search
		if (search.trim()) {
			const q = search.toLowerCase();
			contacts = contacts.filter(c => c.name.toLowerCase().includes(q));
		}
		switch (sortBy) {
			case 'firstName':
				return contacts.sort((a, b) => a.firstName.localeCompare(b.firstName));
			case 'lastName':
				// Contacts with last names first (alphabetically), then those without
				return contacts.sort((a, b) => {
					const aHasLast = a.lastName.length > 0;
					const bHasLast = b.lastName.length > 0;
					if (aHasLast && !bHasLast) return -1;
					if (!aHasLast && bHasLast) return 1;
					if (aHasLast && bHasLast) return a.lastName.localeCompare(b.lastName);
					return a.firstName.localeCompare(b.firstName);
				});
			case 'noLastName':
				// Only show contacts without last names, sorted by first name
				return contacts
					.filter(c => !c.lastName)
					.sort((a, b) => a.firstName.localeCompare(b.firstName));
			case 'added':
				return contacts.sort((a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			case 'recent':
			default:
				return contacts.sort((a, b) => {
					if (!a.lastInteractionAt && !b.lastInteractionAt) return 0;
					if (!a.lastInteractionAt) return 1;
					if (!b.lastInteractionAt) return -1;
					return new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime();
				});
		}
	});

	function getTimeSinceClass(lastInteractionAt: string | null): string {
		if (!lastInteractionAt) return 'stale-month';
		const elapsed = Date.now() - new Date(lastInteractionAt).getTime();
		if (elapsed > ONE_MONTH) return 'stale-month';
		if (elapsed > ONE_WEEK) return 'stale-week';
		return '';
	}

	function formatRelativeTime(dateStr: string | null): string {
		if (!dateStr) return 'No interactions';
		const date = new Date(dateStr);
		const now = new Date();

		// Check if same calendar day
		const isToday = date.toDateString() === now.toDateString();
		if (isToday) return 'today';

		// Check if yesterday
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		const isYesterday = date.toDateString() === yesterday.toDateString();
		if (isYesterday) return 'yesterday';

		const elapsed = now.getTime() - date.getTime();
		const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30);

		if (days < 7) return `${days}d ago`;
		if (weeks < 4) return `${weeks}w ago`;
		return `${months}mo ago`;
	}
</script>

<div class="container">
	<NavBar username={data.user.username} />

	<h1>Contacts</h1>

	{#if data.contacts.length === 0}
		<p class="empty">No contacts yet. Log an interaction to add your first contact.</p>
	{:else}
		<input
			type="text"
			class="search"
			placeholder="Search contacts..."
			bind:value={search}
		/>

		<div class="sort-controls">
			<span class="sort-label">Sort by:</span>
			<button
				class="sort-btn"
				class:active={sortBy === 'recent'}
				onclick={() => (sortBy = 'recent')}
			>
				Recent
			</button>
			<button
				class="sort-btn"
				class:active={sortBy === 'added'}
				onclick={() => (sortBy = 'added')}
			>
				Newest
			</button>
			<button
				class="sort-btn"
				class:active={sortBy === 'firstName'}
				onclick={() => (sortBy = 'firstName')}
			>
				First
			</button>
			<button
				class="sort-btn"
				class:active={sortBy === 'lastName'}
				onclick={() => (sortBy = 'lastName')}
			>
				Last
			</button>
			<button
				class="sort-btn"
				class:active={sortBy === 'noLastName'}
				onclick={() => (sortBy = 'noLastName')}
			>
				No Last
			</button>
		</div>

		<ul class="contact-list">
			{#each sortedContacts() as contact}
				<li>
					<a href="/contacts/{contact.id}" class="contact-item {getTimeSinceClass(contact.lastInteractionAt)}">
						<span class="contact-name">{contact.name}</span>
						<span class="contact-time">{formatRelativeTime(contact.lastInteractionAt)}</span>
					</a>
				</li>
			{/each}
		</ul>
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

	.empty {
		color: #666;
		text-align: center;
		padding: 40px 20px;
	}

	.search {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 15px;
		margin-bottom: 16px;
	}

	.search:focus {
		outline: none;
		border-color: #007bff;
	}

	.sort-controls {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 16px;
	}

	.sort-label {
		color: #666;
		font-size: 14px;
	}

	.sort-btn {
		padding: 6px 12px;
		border: 1px solid #ddd;
		background: white;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.sort-btn:hover {
		border-color: #007bff;
	}

	.sort-btn.active {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	.contact-list {
		list-style: none;
		padding: 0;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.contact-list li {
		border-bottom: 1px solid #eee;
	}

	.contact-list li:last-child {
		border-bottom: none;
	}

	.contact-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		color: #333;
		text-decoration: none;
		transition: background-color 0.15s;
	}

	.contact-item:hover {
		background-color: #f8f9fa;
	}

	.contact-item.stale-week {
		background-color: #fff8e6;
	}

	.contact-item.stale-week:hover {
		background-color: #fff3cd;
	}

	.contact-item.stale-month {
		background-color: #ffe6e6;
	}

	.contact-item.stale-month:hover {
		background-color: #ffcccc;
	}

	.contact-name {
		font-weight: 500;
	}

	.contact-time {
		font-size: 13px;
		color: #888;
	}

	.stale-week .contact-time {
		color: #997a00;
	}

	.stale-month .contact-time {
		color: #cc4444;
	}

</style>
