<script lang="ts">
    let { value, caption }: { value: number; caption?: string } = $props();
</script>

<div class="bg-primary/30 text-neutral-content rounded-box flex flex-col p-2">
    <span class="countdown font-mono text-[11rem] will-change-transform">
        <span style="--value:{value}">{value}</span>
    </span>
    {#if caption}
        <span class="text-2xl">{caption}</span>
    {/if}
</div>
