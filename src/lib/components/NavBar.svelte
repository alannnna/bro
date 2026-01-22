<script lang="ts">
	import { page } from '$app/stores';

	let { username }: { username: string } = $props();

	const navItems = [
		{ href: '/contacts', label: 'Contacts 👯', title: 'All contacts' },
		{ href: '/contacts/new', label: '✚👯', title: 'Add contact' },
		{ href: '/interactions', label: 'Interactions ✨', title: 'All interactions' },
		{ href: '/', label: '✚✨', title: 'Log interaction' },
	];
</script>

<header class="header">
	<nav class="nav">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-btn"
				class:active={$page.url.pathname === item.href}
				title={item.title}
			>
				{item.label}
			</a>
		{/each}
	</nav>
	<div class="user-section">
		<form action="/logout" method="POST">
			<button type="submit" class="logout-btn">Log out</button>
		</form>
	</div>
</header>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #eee;
	}

	.nav {
		display: flex;
		gap: 8px;
	}

	.nav-btn {
		padding: 6px 12px;
		border: 1px solid #ddd;
		background: white;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.15s;
		text-decoration: none;
		color: #333;
	}

	.nav-btn:hover {
		border-color: #007bff;
	}

	.nav-btn.active {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 12px;
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
</style>
