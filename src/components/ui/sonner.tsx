import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-md group-[.toaster]:p-3.5 sm:group-[.toaster]:p-4",
          title:
            "group-[.toast]:font-semibold group-[.toast]:text-xs group-[.toast]:text-foreground",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-bold group-[.toast]:text-xs group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:shadow-xs group-[.toast]:cursor-pointer",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:rounded-lg group-[.toast]:px-2.5 group-[.toast]:py-1",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
