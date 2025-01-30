<script lang="ts">
    import { onMount } from "svelte";

    let { running }: { running: boolean } = $props();

    let milliseconds = $state(0);

    onMount(() => {
        const interval = setInterval(() => {
            if (running) {
                milliseconds = 999 - new Date().getMilliseconds();
            } else {
                milliseconds = 0;
            }
        }, 1000 / 60);
        return () => clearInterval(interval);
    });
</script>

<div class="bg-primary/30 text-neutral-content rounded-box flex flex-col p-2">
    <span
        class="font-mono text-[11rem] will-change-contents [line-height:1em] inline-flex"
    >
        <span class="inline-block height-[1em] overflow-y-hidden"
            >{milliseconds.toString().padStart(3, "0")}</span
        >
    </span>
    <span class="text-2xl">milliseconds</span>
</div>
