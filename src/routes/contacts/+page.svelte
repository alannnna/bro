<script lang="ts">
	let { data } = $props();
</script>

<div class="container">
	<h1>Contacts</h1>

	{#if data.contacts.length === 0}
		<p class="empty">No contacts yet. Log an interaction to add your first contact.</p>
	{:else}
		<ul class="contact-list">
			{#each data.contacts as contact}
				<li>
					<a href="/contacts/{contact.id}" class="contact-item">
						{contact.name}
					</a>
				</li>
			{/each}
		</ul>
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

	h1 {
		margin-bottom: 24px;
	}

	.empty {
		color: #666;
		text-align: center;
		padding: 40px 20px;
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
		display: block;
		padding: 16px 20px;
		color: #333;
		text-decoration: none;
		transition: background-color 0.15s;
	}

	.contact-item:hover {
		background-color: #f8f9fa;
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
