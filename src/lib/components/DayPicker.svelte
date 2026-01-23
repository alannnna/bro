<script lang="ts">
	let { selectedDayOffset = $bindable(0), existingDate = $bindable<string | undefined>(undefined) } = $props();
	let expanded = $state(false);

	function getDayLabel(offset: number): string {
		if (offset === 0) return 'today';
		if (offset === 1) return 'yesterday';
		const date = new Date();
		date.setDate(date.getDate() - offset);
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function getDisplayLabel(): string {
		if (existingDate !== undefined) {
			const date = new Date(existingDate);
			const now = new Date();

			if (date.toDateString() === now.toDateString()) return 'today';

			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			if (date.toDateString() === yesterday.toDateString()) return 'yesterday';

			return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
		}
		return getDayLabel(selectedDayOffset);
	}

	function selectDay(offset: number) {
		selectedDayOffset = offset;
		existingDate = undefined;
		expanded = false;
	}
</script>

<div class="day-picker">
	<button class="date-toggle" onclick={() => (expanded = !expanded)}>
		{getDisplayLabel()}
	</button>
	{#if expanded}
		<div class="date-picker">
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as offset}
				<button
					class="date-option"
					class:selected={existingDate === undefined && selectedDayOffset === offset}
					onclick={() => selectDay(offset)}
				>
					{getDayLabel(offset)}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.day-picker {
		display: flex;
		flex-direction: column;
	}

	.date-toggle {
		background: none;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 14px;
		color: #007bff;
		cursor: pointer;
		transition: border-color 0.2s, background-color 0.2s;
		align-self: flex-start;
	}

	.date-toggle:hover {
		border-color: #007bff;
		background: #f0f7ff;
	}

	.date-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
		padding: 12px;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.date-option {
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.date-option:hover {
		border-color: #007bff;
		background: #f0f7ff;
	}

	.date-option.selected {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}
</style>
