import { useTheme } from "@/shared/theme/theme-provider";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: "light" | "dark" | "system" = "system";
  try {
    const themeCtx = useTheme();
    theme = themeCtx.theme;
  } catch {
    // Fallback if rendered outside ThemeProvider
    theme = "system";
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:p-3.5 sm:group-[.toaster]:p-4 group-[.toaster]:font-sans",
          title:
            "group-[.toast]:font-semibold group-[.toast]:text-xs",
          description:
            "group-[.toast]:text-xs group-[.toast]:leading-relaxed opacity-90",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-semibold group-[.toast]:text-xs group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:shadow-xs group-[.toast]:cursor-pointer",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:rounded-lg group-[.toast]:px-2.5 group-[.toast]:py-1",
          closeButton:
            "!border-border/50 !bg-background/95 !text-foreground/80 hover:!text-foreground hover:!bg-background shadow-xs transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
