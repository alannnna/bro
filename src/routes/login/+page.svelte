<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="container">
	<h1>Log In</h1>

	<form method="POST" use:enhance class="auth-form">
		{#if form?.error}
			<div class="error">{form.error}</div>
		{/if}

		<div class="field">
			<label for="username">Username</label>
			<input
				type="text"
				id="username"
				name="username"
				value={form?.username || ''}
				required
				autocomplete="username"
			/>
		</div>

		<div class="field">
			<label for="password">Password</label>
			<input type="password" id="password" name="password" required autocomplete="current-password" />
		</div>

		<button type="submit">Log In</button>
	</form>
</div>

<style>
	.container {
		max-width: 400px;
		margin: 80px auto;
		padding: 20px;
		font-family: system-ui, sans-serif;
	}

	h1 {
		text-align: center;
		margin-bottom: 30px;
	}

	.auth-form {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.error {
		background: #ffe6e6;
		color: #cc0000;
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 16px;
		text-align: center;
	}

	.field {
		margin-bottom: 16px;
	}

	label {
		display: block;
		margin-bottom: 6px;
		font-weight: 500;
		color: #555;
	}

	input {
		width: 100%;
		padding: 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 16px;
	}

	input:focus {
		outline: none;
		border-color: #007bff;
	}

	button {
		width: 100%;
		padding: 12px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
		margin-top: 8px;
	}

	button:hover {
		background: #0056b3;
	}
</style>
