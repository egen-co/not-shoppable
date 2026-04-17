import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { classes } from "../../../../utils/classes";
import { visibleUnderCursor } from "../../../../utils/dom";

import { useProducts } from "../../../../hooks/useProducts";
import useChatCommand from "../../../../hooks/useChatCommand";
import useSettings from "../../hooks/useSettings";
import useSleeping from "../../hooks/useSleeping";

import Welcome from "../../../../components/Welcome";

import IconProducts from "../../../../components/icons/IconProducts";
import IconSettings from "../../../../components/icons/IconSettings";
import IconWelcome from "../../../../components/icons/IconWelcome";

import Buttons, { type ButtonsOption } from "../Buttons";

import AmbassadorsOverlay from "./Ambassadors";
import SettingsOverlay from "./Settings";

// Show command-triggered popups for 10s
const commandTimeout = 10_000;

const PRODUCT_DATA_URL = "./products.json";

type OverlayOption = ButtonsOption & {
  component: (props: OverlayOptionProps) => React.ReactNode;
};

const overlayOptions = [
  {
    key: "welcome",
    type: "primary",
    icon: IconWelcome,
    title: "Welcome to e.l.f.",
    component: (props) => (
      <Welcome
        {...props}
        className={classes("absolute top-0 left-0 mx-4 my-6", props.className)}
      />
    ),
  },
  {
    key: "ambassadors",
    type: "primary",
    icon: IconProducts,
    title: "Makeup and Skincare Products",
    component: AmbassadorsOverlay,
  },
  {
    key: "settings",
    type: "secondary",
    icon: IconSettings,
    title: "Extension Settings",
    component: SettingsOverlay,
  },
] as const satisfies OverlayOption[];

export const isValidOverlayKey = (key: string) =>
  key === "" || overlayOptions.some((option) => option.key === key);

export type OverlayKey = (typeof overlayOptions)[number]["key"] | "";

type ActiveProductState = {
  key?: string;
  isCommand?: boolean;
};

export interface OverlayOptionProps {
  context: {
    activeProduct: ActiveProductState;
    setActiveProduct: Dispatch<SetStateAction<ActiveProductState>>;
  };
  className?: string;
}

const hiddenClass =
  "invisible opacity-0 -translate-x-10 motion-reduce:translate-x-0";

export default function Overlay() {
  const settings = useSettings();
  const {
    sleeping,
    wake,
    on: addSleepListener,
    off: removeSleepListener,
  } = useSleeping();

  const { products } = useProducts(PRODUCT_DATA_URL);

  const [activeProduct, setActiveProduct] =
    useState<ActiveProductState>({});
  const [visibleOption, setVisibleOption] = useState<OverlayKey>(
    settings.openedMenu.value,
  );
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const awakingRef = useRef(false);

  // update setting when opened menu changes
  useEffect(() => {
    settings.openedMenu.change(visibleOption);
  }, [visibleOption]);

  // open saved (or default) menu when mounted
  useEffect(() => {
    setVisibleOption(settings.openedMenu.value);
  }, [settings.openedMenu.value]);

  // When a chat command is run, wake the overlay
  useChatCommand(
    useCallback(
      (command: string, args: string[]) => {
        if (!settings.disableChatPopup.value) {
          const product = products.find(
            (p) =>
              String(p.id) === command ||
              p.name.toLowerCase().replace(/\s+/g, "") === command.toLowerCase(),
          );
          if ((product || command === "welcome") && args.length === 0) {
            if (product)
              setActiveProduct({ key: String(product.id), isCommand: true });

            // Show the card
            setVisibleOption(product ? "ambassadors" : "welcome");

            // Dismiss the overlay after a delay
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setVisibleOption("");
              setActiveProduct({});
            }, commandTimeout);

            // Track that we're waking up, so that we don't immediately clear the timeout, and wake the overlay
            awakingRef.current = true;
            wake(commandTimeout);
          }
        }
      },
      [settings.disableChatPopup.value, products, wake],
    ),
  );

  // Ensure we clean up the timer when we unmount
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  // If the user interacts with the overlay, clear the auto-dismiss timer
  // Except if we just triggered this wake, in which case we want to ignore it
  useEffect(() => {
    const callback = () => {
      if (awakingRef.current) awakingRef.current = false;
      else if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    addSleepListener("wake", callback);
    return () => removeSleepListener("wake", callback);
  }, [addSleepListener, removeSleepListener]);

  // Handle body clicks, dismissing the overlay if the user clicks outside of it
  const bodyClick = useCallback((e: MouseEvent) => {
    if (!visibleUnderCursor(e)) {
      setVisibleOption("");
    }
  }, []);

  // If the user clicks anywhere in the body, except the overlay itself, close the panels
  // Bind it during the capture phase so that we can process it before any other click handlers
  useEffect(() => {
    document.body.addEventListener("click", bodyClick, true);
    return () => document.body.removeEventListener("click", bodyClick, true);
  }, [bodyClick]);

  // Handle body double clicks, ignoring them inside of overlay elements
  const bodyDblClick = useCallback((e: MouseEvent) => {
    if (visibleUnderCursor(e)) {
      e.stopPropagation();
    }
  }, []);

  // If the user double clicks anywhere in the overlay itself, stop propagating the event
  // This stops double clicks from toggling fullscreen video which is the default behavior
  useEffect(() => {
    document.body.addEventListener("dblclick", bodyDblClick, true);
    return () =>
      document.body.removeEventListener("dblclick", bodyDblClick, true);
  }, [bodyDblClick]);

  // Generate the context for the overlay options
  const context = useMemo<OverlayOptionProps["context"]>(
    () => ({
      activeProduct,
      setActiveProduct,
    }),
    [activeProduct],
  );

  // Unselect product if product is no longer available after refresh
  useEffect(() => {
    if (
      products.length > 0 &&
      activeProduct.key &&
      !products.find((p) => String(p.id) === activeProduct.key)
    ) {
      setActiveProduct({});
    }
  }, [products, activeProduct.key]);

  return (
    <div
      className={classes(
        "flex h-full w-full transition-[opacity,visibility,transform,translate] will-change-[opacity,transform,translate]",
        sleeping &&
          !(
            process.env.NODE_ENV === "development" &&
            settings.disableOverlayHiding.value
          ) &&
          hiddenClass,
      )}
    >
      <Buttons
        options={overlayOptions}
        onClick={setVisibleOption}
        active={visibleOption}
      />
      <div className="relative h-full w-full">
        {overlayOptions.map((option) => (
          <option.component
            key={option.key}
            context={context}
            className={classes(
              "transition-[opacity,visibility,transform,translate] will-change-[opacity,transform,translate]",
              visibleOption !== option.key && hiddenClass,
            )}
          />
        ))}
      </div>
    </div>
  );
}
