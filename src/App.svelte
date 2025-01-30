<script lang="ts">
    import { onMount } from "svelte";
    import calendar from "./assets/basic.ics?raw";
    import ICAL from "ical.js";
    import Countdown from "./lib/Countdown.svelte";
    import Milliseconds from "./lib/Milliseconds.svelte";
    import { scale } from "svelte/transition";

    const jcalData = ICAL.parse(calendar);
    const vcalendar = new ICAL.Component(jcalData);

    const meetings = vcalendar
        .getAllSubcomponents("vevent")
        .map((vevent) => new ICAL.Event(vevent))
        .flatMap((event) => {
            if (event.isRecurring()) {
                const iterator = event.iterator();
                let next;
                const events = [];

                while ((next = iterator.next())) {
                    const occurence = event.getOccurrenceDetails(next);
                    events.push({
                        startDate: occurence.startDate,
                        endDate: occurence.endDate,
                        event,
                    });
                }
                return events;
            }
            return {
                startDate: event.startDate,
                endDate: event.endDate,
                event,
            };
        })
        .toSorted((a, b) => a.startDate.compare(b.startDate));

    let now = $state(ICAL.Time.fromJSDate(new Date(), true));

    const secondsLeft = $derived(
        ICAL.Time.fromDateTimeString("2025-02-23T08:00:00")
            .subtractDateTz(now)
            .toSeconds()
    );

    const currentMeeting = $derived(
        meetings.find((meeting) => {
            if (
                meeting.startDate.compare(now) == 1 ||
                meeting.startDate.compare(now) == 0
            ) {
                return false;
            }

            if (
                meeting.endDate.compare(now) == 1 ||
                meeting.endDate.compare(now) == 0
            ) {
                return true;
            }
            return false;
        })
    );

    const nextMeeting = $derived(
        meetings.find((meeting) => {
            if (
                meeting.endDate.compare(now) == 1 ||
                meeting.endDate.compare(now) == 0
            ) {
                return true;
            }
            return false;
        })
    );

    const meetingSecondsLeft = $derived(
        meetings
            .map((meeting) => {
                if (
                    meeting.startDate.compare(now) == 1 ||
                    meeting.startDate.compare(now) == 0
                ) {
                    return meeting.event.duration.toSeconds();
                }
                if (meeting.endDate.compare(now) == 1) {
                    return meeting.endDate.subtractDateTz(now).toSeconds();
                }
                return 0;
            })
            .reduce((acc, val) => acc + val, 0)
    );

    onMount(() => {
        const x = document
            .getElementById(nextMeeting?.startDate.toString() ?? "")
            ?.getBoundingClientRect().left;
        console.log(nextMeeting?.startDate.toJSDate().toLocaleDateString());
        console.log(nextMeeting?.event.uid);
        if (x) {
            const meetingTimeline = document.getElementById("meetingTimeline")!;
            console.log(document.getElementById(nextMeeting?.event.uid ?? ""));
            meetingTimeline.scrollTo({
                left: x - meetingTimeline.getBoundingClientRect().left - 20,
                top: 0,
                behavior: "smooth",
            });
        }

        const interval = setInterval(() => {
            const date = new Date();
            // date.setSeconds(date.getSeconds() + 0.6);
            now = ICAL.Time.fromJSDate(date, true);
        }, 1000 / 60);

        return () => {
            clearInterval(interval);
        };
    });

    let showingMeetingMinutes = $state(currentMeeting != null);
    let showingMilliseconds = $state(false);
</script>

<header
    class="fixed top-0 min-h-15 flex flex-row place-items-center place-content-between w-screen py-3 px-5 bg-primary/10 backdrop-blur-md z-50 flex-wrap"
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

<main class="min-w-screen px-5 mt-15">
    <div
        class="min-h-main flex flex-col place-content-center gap-10 place-items-center"
    >
        {#if showingMeetingMinutes}
            <h1 class="text-4xl font-bold text-center text-neutral-content">
                Meeting time until <span class="text-amber-300">WILDCARD</span>!
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
                    <Milliseconds running={currentMeeting != undefined} />
                {/if}
            </div>
        {:else}
            <h1 class="text-4xl font-bold text-center text-neutral-content">
                Time until <span class="text-amber-300">WILDCARD</span>!
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
        {#if currentMeeting}
            <div
                transition:scale
                class="flex flex-col gap-5 place-self-stretch mx-32 p-5 bg-accent/20 text-neutral-content rounded-2xl"
            >
                <div class="text-center w-max-[50%]">
                    <h2 class="text-2xl font-bold">
                        {currentMeeting.event.summary}
                    </h2>
                    <p class="text-lg">
                        {currentMeeting.event.description}
                    </p>
                </div>
                <progress
                    class="w-full progress progress-accent h-3"
                    value={currentMeeting.event.duration.toSeconds() -
                        currentMeeting.endDate.subtractDateTz(now).toSeconds()}
                    max={currentMeeting.event.duration.toSeconds()}
                ></progress>
            </div>
        {/if}
        <ul
            class="timeline place-self-stretch mx-10 overflow-x-scroll p-5 bg-accent/20 text-neutral-content fill-neutral-content rounded-2xl overflow-y-clip"
            id="meetingTimeline"
        >
            {#each meetings as { startDate, endDate, event }, i}
                <li
                    id={startDate.toString()}
                    class="-mb-20"
                    title={event.description}
                >
                    {#if i != 0}
                        <hr
                            class={"transition-colors rounded-r-full" +
                                (startDate.compare(now) == 1
                                    ? ""
                                    : " bg-accent")}
                        />
                    {/if}
                    <div
                        class={"timeline-box timeline-start bg-accent/30 border-accent/40 max-w-32 text-center"}
                    >
                        {event.summary}
                    </div>
                    <div class="timeline-middle size-12">
                        <p
                            class={"text-lg size-12 bg-accent/40 text-center content-center rounded-full" +
                                (currentMeeting?.startDate == event.startDate
                                    ? " animate-bounce"
                                    : "")}
                        >
                            {startDate.month}/{startDate.day}
                        </p>
                    </div>
                    <hr
                        class={"transition-colors rounded-l-full" +
                            (i != meetings.length - 1
                                ? endDate.compare(now) == 1
                                    ? ""
                                    : " bg-accent"
                                : "bg-amber-300")}
                    />
                </li>
            {/each}
            <li class="-mb-20">
                <hr class="bg-amber-300" />
                <div
                    class={"font-bold timeline-box timeline-start bg-amber-300/30 border-amber-300/40 max-w-32 text-center"}
                >
                    WILDCARD!
                </div>
                <div class="timeline-middle">
                    <p
                        class="font-bold text-lg w-12 h-12 bg-amber-300/40 text-center content-center rounded-full"
                    >
                        2/23
                    </p>
                </div>
            </li>
        </ul>
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
