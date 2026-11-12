import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LinkifiedText, isGoogleMapsUrl } from "./LinkifiedText";

describe("isGoogleMapsUrl", () => {
  it("reconoce URLs de Google Maps y Waze", () => {
    expect(isGoogleMapsUrl("https://maps.app.goo.gl/9rcSXMyiGVWhXX5L7?g_st=iw")).toBe(true);
    expect(isGoogleMapsUrl("https://goo.gl/maps/abc123xyz")).toBe(true);
    expect(isGoogleMapsUrl("https://www.google.com/maps?q=-0.180653,-78.467838")).toBe(true);
    expect(isGoogleMapsUrl("https://maps.google.com/?q=Quito")).toBe(true);
    expect(isGoogleMapsUrl("https://waze.com/ul?ll=-0.18,-78.46")).toBe(true);
    expect(isGoogleMapsUrl("https://google.com")).toBe(false);
    expect(isGoogleMapsUrl("https://example.com/portal")).toBe(false);
  });
});

describe("LinkifiedText", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza texto normal sin modificar si no contiene enlaces", () => {
    render(<LinkifiedText text="Hola buenas tardes, ¿en qué podemos ayudarle?" />);
    expect(screen.getByText("Hola buenas tardes, ¿en qué podemos ayudarle?")).toBeInTheDocument();
  });

  it("convierte una URL de Google Maps en un enlace accesible y genera botón de apertura", () => {
    const mapsLink = "https://maps.app.goo.gl/9rcSXMyiGVWhXX5L7?g_st=iw";
    render(<LinkifiedText text={mapsLink} />);

    // Verifica que el texto sea un enlace <a> con target="_blank"
    const link = screen.getByTitle("Abrir mapa en Google Maps");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", mapsLink);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    // Verifica que exista el botón interactivo de abrir ubicación en Google Maps
    const mapButton = screen.getByRole("link", { name: /abrir ubicación en google maps/i });
    expect(mapButton).toBeInTheDocument();
    expect(mapButton).toHaveAttribute("href", mapsLink);
    expect(mapButton).toHaveAttribute("target", "_blank");
  });

  it("convierte enlaces normales (http/https y www) en hipervínculos clickeables", () => {
    render(
      <LinkifiedText text="Visite nuestro portal en https://xgo.ec o www.google.com para más info." />,
    );

    const link1 = screen.getByRole("link", { name: /https:\/\/xgo\.ec/i });
    expect(link1).toHaveAttribute("href", "https://xgo.ec");
    expect(link1).toHaveAttribute("target", "_blank");

    const link2 = screen.getByRole("link", { name: /www\.google\.com/i });
    expect(link2).toHaveAttribute("href", "https://www.google.com");
    expect(link2).toHaveAttribute("target", "_blank");
  });

  it("permite deshabilitar el botón de mapa cuando showMapButton es false", () => {
    const mapsLink = "https://maps.app.goo.gl/123";
    render(<LinkifiedText text={mapsLink} showMapButton={false} />);

    const link = screen.getByTitle("Abrir mapa en Google Maps");
    expect(link).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /abrir ubicación en google maps/i }),
    ).not.toBeInTheDocument();
  });
});
