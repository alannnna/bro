<script lang="ts">
	import { page } from '$app/stores';

	let { username }: { username: string } = $props();
	let dropdownOpen = $state(false);

	const navItems = [
		{ href: '/', label: '✚✨', title: 'Log interaction' },
		{ href: '/contacts/new', label: '✚👯', title: 'Add contact' },
		{ href: '/interactions', label: 'Interactions✨', title: 'All interactions' },
		{ href: '/contacts', label: 'Contacts👯', title: 'All contacts' },
	];

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}
</script>

<svelte:window onclick={(e) => {
	if (dropdownOpen && !(e.target as Element).closest('.account-menu')) {
		closeDropdown();
	}
}} />

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
	<div class="account-menu">
		<button class="account-btn" onclick={toggleDropdown} title={username}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="8" r="4"/>
				<path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
			</svg>
		</button>
		{#if dropdownOpen}
			<div class="dropdown">
				<a href="/api/export" download class="dropdown-item" onclick={closeDropdown}>
					Export data
				</a>
				<form action="/logout" method="POST">
					<button type="submit" class="dropdown-item logout">Log out</button>
				</form>
			</div>
		{/if}
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

	.account-menu {
		position: relative;
	}

	.account-btn {
		background: none;
		border: none;
		color: #666;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.15s, color 0.15s;
	}

	.account-btn:hover {
		background: #f0f0f0;
		color: #333;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 8px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 150px;
		overflow: hidden;
		z-index: 100;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 12px 16px;
		text-align: left;
		background: none;
		border: none;
		font-size: 14px;
		color: #333;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.dropdown-item:hover {
		background: #f8f9fa;
	}

	.dropdown-item.logout {
		color: #cc0000;
		border-top: 1px solid #eee;
	}

	.dropdown-item.logout:hover {
		background: #fff5f5;
	}
</style>
