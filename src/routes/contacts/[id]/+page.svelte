<script lang="ts">
	let { data } = $props();

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
</script>

<div class="container">
	<header class="header">
		<span class="username">{data.user.username}</span>
		<form action="/logout" method="POST">
			<button type="submit" class="logout-btn">Log out</button>
		</form>
	</header>

	<a href="/contacts" class="back-link">← All contacts</a>

	<h1>{data.contact.name}</h1>

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
		margin-bottom: 24px;
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
