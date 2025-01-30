<script lang="ts">
    import { onMount } from "svelte";
    import calendar from "./assets/basic.ics?raw";
    import ICAL from "ical.js";
    import Countdown from "./lib/Countdown.svelte";
    import Milliseconds from "./lib/Milliseconds.svelte";

    const jcalData = ICAL.parse(calendar);
    const vcalendar = new ICAL.Component(jcalData);

    const events = vcalendar
        .getAllSubcomponents("vevent")
        .map((vevent) => new ICAL.Event(vevent))
        .flatMap((event) => {
            if (event.isRecurring()) {
                const iterator = event.iterator();
                let next;
                const events = [];

                while ((next = iterator.next())) {
                    events.push({ time: next, duration: event.duration });
                }
                return events;
            }
            return [{ time: event.startDate, duration: event.duration }];
        });

    let now = $state(ICAL.Time.fromJSDate(new Date(), true));

    const secondsLeft = $derived(
        ICAL.Time.fromDateTimeString("2025-02-23T00:00:00")
            .subtractDate(now)
            .toSeconds()
    );

    const currentEvent = $derived(
        events.find((event) => {
            if (event.time.compare(now) == 1 || event.time.compare(now) == 0) {
                return false;
            }

            const endTime = event.time
                .clone()
                .adjust(
                    event.duration.days,
                    event.duration.hours,
                    event.duration.minutes,
                    event.duration.seconds
                );
            if (endTime.compare(now) == 1 || endTime.compare(now) == 0) {
                return true;
            }
            return false;
        })
    );

    const meetingSecondsLeft = $derived(
        events
            .map((event) => {
                if (
                    event.time.compare(now) == 1 ||
                    event.time.compare(now) == 0
                ) {
                    return event.duration.toSeconds();
                }
                const endTime = event.time
                    .clone()
                    .adjust(
                        event.duration.days,
                        event.duration.hours,
                        event.duration.minutes,
                        event.duration.seconds
                    );
                if (endTime.compare(now) == 1) {
                    return endTime.subtractDate(now).toSeconds();
                }
                return 0;
            })
            .reduce((acc, val) => acc + val, 0)
    );

    onMount(() => {
        const interval = setInterval(() => {
            now = ICAL.Time.fromJSDate(new Date(), true);
        }, 1000);

        return () => clearInterval(interval);
    });

    let showingMeetingMinutes = $state(true);
    let showingMilliseconds = $state(false);
</script>

<header
    class="fixed top-0 h-15 flex flex-row place-items-center place-content-between w-screen py-3 px-5 bg-primary/10 backdrop-blur-md z-50"
>
    <div class="flex flex-row gap-3">
        <button class="btn btn-square btn-secondary size-10">+</button>
        <button class="btn btn-square btn-secondary size-10">-</button>
    </div>
    <div class="flex flex-row place-content-center gap-3 text-neutral-content">
        <div class="flex items-center justify-center gap-3">
            <input
                type="checkbox"
                bind:checked={showingMeetingMinutes}
                class="toggle toggle-lg toggle-secondary"
                id="showingMeetingMinutes"
            />
            <label for="showingMeetingMinutes" class="text-lg">
                Count only meeting minutes
            </label>
        </div>
        <div class="flex items-center justify-center gap-3">
            <input
                type="checkbox"
                bind:checked={showingMilliseconds}
                class="toggle toggle-lg toggle-secondary"
                id="showingMilliseconds"
            />
            <label for="showingMilliseconds" class="text-lg">
                Show milliseconds
            </label>
        </div>
    </div>
</header>

<main class="container mx-auto p-5">
    <div
        class="h-screen flex flex-col place-content-center gap-10 place-items-center"
    >
        {#if showingMeetingMinutes}
            <h1 class="text-4xl font-bold text-center text-neutral-content">
                Meeting time until WILDCARD!
            </h1>
            <div class="grid auto-cols-max grid-flow-col gap-5 text-center">
                <Countdown
                    value={Math.floor(meetingSecondsLeft / 60 / 60)}
                    caption="hours"
                />
                <Countdown
                    value={Math.floor((meetingSecondsLeft / 60) % 60)}
                    caption="minutes"
                />
                <Countdown
                    value={Math.floor(meetingSecondsLeft % 60)}
                    caption="seconds"
                />
                {#if showingMilliseconds}
                    <Milliseconds running={currentEvent != undefined} />
                {/if}
            </div>
        {:else}
            <h1 class="text-4xl font-bold text-center text-neutral-content">
                Time until WILDCARD!
            </h1>
            <div class="grid auto-cols-max grid-flow-col gap-5 text-center">
                <Countdown
                    value={Math.floor(secondsLeft / 60 / 60 / 24)}
                    caption="days"
                />
                <Countdown
                    value={Math.floor((secondsLeft / 60 / 60) % 24)}
                    caption="hours"
                />
                <Countdown
                    value={Math.floor((secondsLeft / 60) % 60)}
                    caption="minutes"
                />
                <Countdown
                    value={Math.floor(secondsLeft % 60)}
                    caption="seconds"
                />
                {#if showingMilliseconds}
                    <Milliseconds running={true} />
                {/if}
            </div>
        {/if}
    </div>
    <iframe
        class="m-auto w-full rounded-2xl h-[80vh] mb-10"
        src="https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=America%2FLos_Angeles&showPrint=0&title=Robotics%20Meetings&showTabs=0&showNav=0&showTz=0&src=Y19iMjJmZjEzZGNiZmJiZWU1NTY0OTZiMDIyYWFlYTZlYjc1MjlkNmMzZmMzMmY4Y2NlNzZkZDZiNGVlNWUzOGU2QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y19kNTJmYzdmNTU1ZTg3NmI0ZGIxZWU3ZjBmNGM2NThiNmIzZDAzMDc3ZTA4YWJlZTJmY2I1MzlmZjQxYmE4Mjk4QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=Y184NWZhNDA3YjE5OTljMmVkN2Y3YTAxNTcxMmRjNjYxZDkzYTE5OGZlZGFmZWY1OTlhYmVmN2Q2MjhmMjQyZjI0QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&color=%230B8043&color=%23E67C73&color=%23F6BF26&dates=20250201/20250223"
        style="border:solid 1px #777"
        width="800"
        height="600"
        frameborder="0"
        scrolling="no"
        title="Robotics Meetings Calendar"
    ></iframe>
</main>
