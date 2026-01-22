<script lang="ts">
	import { page } from '$app/stores';

	let { username }: { username: string } = $props();

	const navItems = [
		{ href: '/', label: '✚✨', title: 'Log interaction' },
		{ href: '/contacts/new', label: '✚👯', title: 'Add contact' },
		{ href: '/interactions', label: 'Interactions✨', title: 'All interactions' },
		{ href: '/contacts', label: 'Contacts👯', title: 'All contacts' },
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
		gap: 16px;
	}

	.nav-btn {
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		color: #555;
		padding: 6px 0;
		border-bottom: 2px solid transparent;
	}

	.nav-btn:hover {
		color: #333;
	}

	.nav-btn.active {
		color: #333;
		border-bottom-color: #007bff;
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
