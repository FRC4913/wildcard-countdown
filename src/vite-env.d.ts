/// <reference types="svelte" />
/// <reference types="vite/client" />
declare module "*.ics?raw" {
    const content: string;

    export default content;
}
