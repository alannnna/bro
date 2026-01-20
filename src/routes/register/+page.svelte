<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="container">
	<h1>Register</h1>

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
			<input type="password" id="password" name="password" required autocomplete="new-password" />
		</div>

		<div class="field">
			<label for="confirmPassword">Confirm Password</label>
			<input
				type="password"
				id="confirmPassword"
				name="confirmPassword"
				required
				autocomplete="new-password"
			/>
		</div>

		<button type="submit">Register</button>
	</form>

	<p class="switch">
		Already have an account? <a href="/login">Log In</a>
	</p>
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
		background: #28a745;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
		margin-top: 8px;
	}

	button:hover {
		background: #218838;
	}

	.switch {
		text-align: center;
		margin-top: 20px;
		color: #666;
	}

	.switch a {
		color: #007bff;
		text-decoration: none;
	}

	.switch a:hover {
		text-decoration: underline;
	}
</style>
