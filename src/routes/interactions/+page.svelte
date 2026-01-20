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

	function renderHearts(rating: number | null): string {
		if (!rating) return '';
		return '♥'.repeat(rating) + '♡'.repeat(5 - rating);
	}
</script>

<div class="container">
	<header class="header">
		<span class="username">{data.user.username}</span>
		<form action="/logout" method="POST">
			<button type="submit" class="logout-btn">Log out</button>
		</form>
	</header>

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
					<div class="interaction-header">
						<span class="contact-name">{interaction.contactName}</span>
						<span class="date">{formatDate(interaction.createdAt)}</span>
					</div>
					{#if interaction.rating && interaction.rating > 0}
						<div class="hearts">{renderHearts(interaction.rating)}</div>
					{/if}
					{#if interaction.notes}
						<p class="notes">{interaction.notes}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<a href="/" class="back-link">← Log an interaction</a>
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

	.contact-name {
		font-weight: 600;
		color: #333;
	}

	.date {
		font-size: 13px;
		color: #888;
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

	.back-link {
		display: inline-block;
		margin-top: 24px;
		color: #007bff;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}
</style>
