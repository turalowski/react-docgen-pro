import { SimpleComponent, type ActionItemProps } from './SimpleComponent';

export interface InjectedProps {
  /** Timestamp injected by the higher order component. */
  injectedAt: number;

  /** Theme injected by the higher order component. */
  theme: 'light' | 'dark';
}

export function withExtraProps(
  WrappedComponent: React.ComponentType<ActionItemProps & InjectedProps>
) {
  return function WithExtraProps(props: ActionItemProps) {
    const injectedProps: InjectedProps = {
      injectedAt: Date.now(),
      theme: 'light',
    };

    return <WrappedComponent {...props} {...injectedProps} />;
  };
}

function SimpleComponentWithInjectedProps(props: ActionItemProps & InjectedProps) {
  return (
    <div data-theme={props.theme} data-injected-at={props.injectedAt}>
      <SimpleComponent {...props} />
    </div>
  );
}

export const HigherOrderComponent = withExtraProps(SimpleComponentWithInjectedProps);
