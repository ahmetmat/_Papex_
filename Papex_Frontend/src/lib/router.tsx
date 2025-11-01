import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Params = Record<string, string>;

type NavigateOptions = {
  replace?: boolean;
};

type NavigationContextValue = {
  location: string;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const NavigationContext = React.createContext<NavigationContextValue | null>(null);

type RouteState = {
  segments: string[];
  index: number;
  params: Params;
};

const RouteStateContext = React.createContext<RouteState>({ segments: [], index: 0, params: {} });
const OutletContext = React.createContext<React.ReactNode>(null);

const cleanPath = (path: string) => (path.startsWith('/') ? path.slice(1) : path);

const parseLocation = (url: string) => {
  const pathname = url.split(/[?#]/)[0] ?? '/';
  const cleaned = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const segments = cleaned === '' ? [] : cleaned.split('/');
  return segments;
};

type MatchResult = {
  matched: boolean;
  newIndex: number;
  params: Params;
};

const matchPath = (pattern: string | undefined, state: RouteState): MatchResult => {
  const { segments, index } = state;

  if (pattern === '*') {
    return { matched: true, newIndex: segments.length, params: {} };
  }

  if (!pattern || pattern === '/') {
    return { matched: true, newIndex: index, params: {} };
  }

  const parts = cleanPath(pattern).split('/');
  const params: Params = {};
  let cursor = index;

  for (const part of parts) {
    const segment = segments[cursor];
    if (segment === undefined) {
      return { matched: false, newIndex: index, params: {} };
    }

    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(segment);
    } else if (part !== segment) {
      return { matched: false, newIndex: index, params: {} };
    }
    cursor += 1;
  }

  return { matched: true, newIndex: cursor, params };
};

interface BrowserRouterProps {
  children: React.ReactNode;
}

export const BrowserRouter: React.FC<BrowserRouterProps> = ({ children }) => {
  const [location, setLocation] = useState(() => window.location.pathname + window.location.search + window.location.hash);

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    const url = to.startsWith('/') ? to : `/${to}`;
    if (options?.replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
    setLocation(window.location.pathname + window.location.search + window.location.hash);
  }, []);

  useEffect(() => {
    const handler = () => setLocation(window.location.pathname + window.location.search + window.location.hash);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const segments = useMemo(() => parseLocation(location), [location]);

  const navigationValue = useMemo<NavigationContextValue>(() => ({ location, navigate }), [location, navigate]);
  const initialRouteState = useMemo<RouteState>(() => ({ segments, index: 0, params: {} }), [segments]);

  return (
    <NavigationContext.Provider value={navigationValue}>
      <RouteStateContext.Provider value={initialRouteState}>{children}</RouteStateContext.Provider>
    </NavigationContext.Provider>
  );
};

interface RouteProps {
  path?: string;
  index?: boolean;
  element: React.ReactNode;
  children?: React.ReactNode;
}

const Route: React.FC<RouteProps> = () => null;
Route.displayName = 'Route';

const getChildrenArray = (children: React.ReactNode) => React.Children.toArray(children) as React.ReactElement<RouteProps>[];

interface RoutesProps {
  children?: React.ReactNode;
}

export const Routes: React.FC<RoutesProps> = ({ children }) => {
  const routeState = useContext(RouteStateContext);
  if (!routeState) {
    throw new Error('Routes must be used within a BrowserRouter');
  }

  const childArray = getChildrenArray(children);

  for (const child of childArray) {
    if (!React.isValidElement<RouteProps>(child)) {
      continue;
    }

    const { props } = child;

    if (props.index) {
      if (routeState.index === routeState.segments.length) {
        const mergedParams = routeState.params;
        return (
          <RouteStateContext.Provider value={{ ...routeState, params: mergedParams }}>
            <OutletContext.Provider value={props.children ? <Routes>{props.children}</Routes> : null}>
              {props.element}
            </OutletContext.Provider>
          </RouteStateContext.Provider>
        );
      }
      continue;
    }

    const match = matchPath(props.path, routeState);
    if (!match.matched) {
      continue;
    }

    const mergedParams = { ...routeState.params, ...match.params };

    return (
      <RouteStateContext.Provider value={{ segments: routeState.segments, index: match.newIndex, params: mergedParams }}>
        <OutletContext.Provider value={props.children ? <Routes>{props.children}</Routes> : null}>
          {props.element}
        </OutletContext.Provider>
      </RouteStateContext.Provider>
    );
  }

  return null;
};

export { Route };

export const Outlet: React.FC = () => {
  const outlet = useContext(OutletContext);
  return <>{outlet}</>;
};

export const useParams = <T extends Record<string, string | undefined> = {}>() => {
  const { params } = useContext(RouteStateContext);
  return params as T;
};

export const useNavigate = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigate must be used within a BrowserRouter');
  }
  return ctx.navigate;
};

interface NavigateProps {
  to: string;
  replace?: boolean;
}

export const Navigate: React.FC<NavigateProps> = ({ to, replace }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);
  return null;
};

interface NavLinkProps {
  to: string;
  className?: ((props: { isActive: boolean }) => string) | string;
  children: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, className, children }) => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('NavLink must be used within a BrowserRouter');
  }
  const isActive = ctx.location === to || (to !== '/' && ctx.location.startsWith(to));

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    ctx.navigate(to);
  };

  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <a href={to} onClick={handleClick} className={computedClassName}>
      {children}
    </a>
  );
};

export const useLocation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within a BrowserRouter');
  }
  const url = new URL(ctx.location, window.location.origin);
  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
};
