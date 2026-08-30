export interface GreetingProps {
  /** The user's display name. */
  name: string;
  /**
   * Number of times to repeat the greeting.
   * @default 1
   */
  count?: number;
}

export function Greeting(props: GreetingProps) {
  const count = props.count ?? 1;
  return <div>{Array.from({ length: count }, () => `Hello ${props.name}`).join(' ')}</div>;
}
