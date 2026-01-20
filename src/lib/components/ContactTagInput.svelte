<script lang="ts">
	interface SelectedContact {
		name: string;
		isNew: boolean;
	}

	let {
		selectedContacts = $bindable<SelectedContact[]>([]),
		placeholder = 'Start typing a name...'
	}: {
		selectedContacts: SelectedContact[];
		placeholder?: string;
	} = $props();

	let inputValue = $state('');
	let suggestions = $state<{ id: number; name: string }[]>([]);
	let showSuggestions = $state(false);
	let inputElement: HTMLInputElement;

	let searchTimeout: ReturnType<typeof setTimeout>;

	async function searchContacts(query: string) {
		if (!query.trim()) {
			suggestions = [];
			showSuggestions = false;
			return;
		}
		const res = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);
		suggestions = await res.json();
		showSuggestions = true;
	}

	function isExactMatch(query: string): boolean {
		return suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase());
	}

	function isAlreadySelected(name: string): boolean {
		return selectedContacts.some((c) => c.name.toLowerCase() === name.toLowerCase());
	}

	function handleContactInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.endsWith(',')) {
			const name = value.slice(0, -1).trim();
			if (name && !isAlreadySelected(name)) {
				const isNew = !isExactMatch(name);
				selectedContacts = [...selectedContacts, { name, isNew }];
			}
			inputValue = '';
			suggestions = [];
			showSuggestions = false;
			return;
		}

		inputValue = value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchContacts(value), 150);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Backspace' && inputValue === '' && selectedContacts.length > 0) {
			selectedContacts = selectedContacts.slice(0, -1);
		}
	}

	function selectContact(name: string, isNew: boolean) {
		if (!isAlreadySelected(name)) {
			selectedContacts = [...selectedContacts, { name, isNew }];
		}
		inputValue = '';
		suggestions = [];
		showSuggestions = false;
		inputElement?.focus();
	}

	function removeContact(index: number) {
		selectedContacts = selectedContacts.filter((_, i) => i !== index);
	}
</script>

<div class="autocomplete">
	<div class="tags-input" onclick={() => inputElement?.focus()}>
		{#each selectedContacts as contact, i}
			<span class="tag">
				{contact.name}{#if contact.isNew} <span class="new-indicator">(new)</span>{/if}
				<button type="button" class="tag-remove" onclick={() => removeContact(i)}>&times;</button>
			</span>
		{/each}
		<input
			bind:this={inputElement}
			type="text"
			value={inputValue}
			oninput={handleContactInput}
			onkeydown={handleKeydown}
			onfocus={() => inputValue && searchContacts(inputValue)}
			onblur={() => setTimeout(() => (showSuggestions = false), 200)}
			placeholder={selectedContacts.length === 0 ? placeholder : ''}
			autocomplete="off"
		/>
	</div>
	{#if showSuggestions}
		<div class="suggestions">
			{#each suggestions.filter((s) => !isAlreadySelected(s.name)) as contact}
				<button type="button" class="suggestion" onclick={() => selectContact(contact.name, false)}>
					{contact.name}
				</button>
			{/each}
			{#if inputValue.trim() && !isExactMatch(inputValue)}
				<button type="button" class="suggestion add-new" onclick={() => selectContact(inputValue.trim(), true)}>
					Add "{inputValue.trim()}" <span class="new-indicator">(new)</span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.autocomplete {
		position: relative;
	}

	.tags-input {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		min-height: 48px;
		cursor: text;
		transition: border-color 0.2s;
		align-items: center;
		background: white;
	}

	.tags-input:focus-within {
		border-color: #007bff;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: #e8f4ff;
		border-radius: 4px;
		font-size: 14px;
		color: #333;
	}

	.tag .new-indicator {
		color: #28a745;
		font-size: 12px;
	}

	.tag-remove {
		background: none;
		border: none;
		color: #666;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		padding: 0 2px;
		margin-left: 2px;
	}

	.tag-remove:hover {
		color: #cc0000;
	}

	.tags-input input {
		flex: 1;
		min-width: 120px;
		border: none;
		padding: 4px 0;
		font-size: 16px;
		font-family: inherit;
		outline: none;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 2px solid #e0e0e0;
		border-top: none;
		border-radius: 0 0 8px 8px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
	}

	.suggestion {
		display: block;
		width: 100%;
		padding: 10px 12px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 16px;
	}

	.suggestion:hover {
		background: #f0f7ff;
	}

	.suggestion.add-new {
		border-top: 1px solid #eee;
		color: #28a745;
	}

	.suggestion .new-indicator {
		color: #28a745;
		font-size: 13px;
	}
</style>
