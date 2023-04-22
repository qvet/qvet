import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function RelativeTime({ timestamp }: { timestamp: string }) {
  const datetime = dayjs(timestamp);
  return <span title={datetime.toString()}>{dayjs().to(datetime)}</span>;
}
