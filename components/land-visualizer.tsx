"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Draggable from "react-draggable";
import { Plus, Trash2, Save, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryState } from "nuqs";
import { useMediaQuery } from "@/hooks/use-media-query"; // Add this import

type Element = {
  id: number;
  name: string; // Add this line
  width: number;
  height: number;
  x: number;
  y: number;
};

type SavedLayout = {
  id: string;
  name: string;
  landWidth: number;
  landHeight: number;
  elements: Element[];
};

type AppState = {
  landWidth: number;
  landHeight: number;
  elements: Element[];
  newElementWidth: number;
  newElementHeight: number;
  savedLayouts: SavedLayout[];
  currentLayoutId: string | null;
};

export function LandVisualizerComponent() {
  const [state, setState] = useState<AppState>({
    landWidth: 100,
    landHeight: 100,
    elements: [],
    newElementWidth: 10,
    newElementHeight: 10,
    savedLayouts: [],
    currentLayoutId: null,
  });
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newElementName, setNewElementName] = useState(""); // Add this line
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use nuqs to sync state with URL
  const [sharedState, setSharedState] = useQueryState("state", {
    parse: (value) => JSON.parse(decodeURIComponent(value)),
    serialize: (value) => encodeURIComponent(JSON.stringify(value)),
  });

  const updateLocalStorage = useCallback(
    (newState: AppState) => {
      localStorage.setItem("landVisualizerState", JSON.stringify(newState));
      setSharedState(newState);
    },
    [setSharedState]
  );

  const addElement = () => {
    const newElement: Element = {
      id: Date.now(),
      name: newElementName || `Element ${state.elements.length + 1}`, // Add this line
      width: state.newElementWidth,
      height: state.newElementHeight,
      x: 0,
      y: 0,
    };
    setState((prevState) => {
      const newState = {
        ...prevState,
        elements: [...prevState.elements, newElement],
      };
      updateLocalStorage(newState);
      return newState;
    });
    setNewElementName(""); // Reset the new element name input
  };

  const removeElement = (id: number) => {
    setState((prevState) => {
      const newState = {
        ...prevState,
        elements: prevState.elements.filter((element) => element.id !== id),
      };
      updateLocalStorage(newState);
      return newState;
    });
  };

  const updateElementPosition = (id: number, x: number, y: number) => {
    setState((prevState) => {
      const newState = {
        ...prevState,
        elements: prevState.elements.map((element) =>
          element.id === id ? { ...element, x, y } : element
        ),
      };
      updateLocalStorage(newState);
      return newState;
    });
  };

  const updateElementName = (id: number, newName: string) => {
    setState((prevState) => {
      const newState = {
        ...prevState,
        elements: prevState.elements.map((element) =>
          element.id === id ? { ...element, name: newName } : element
        ),
      };
      updateLocalStorage(newState);
      return newState;
    });
  };

  const saveLayout = () => {
    const newLayout: SavedLayout = {
      id: Date.now().toString(),
      name: newLayoutName || "Nowy układ",
      landWidth: state.landWidth,
      landHeight: state.landHeight,
      elements: state.elements,
    };
    setState((prevState) => {
      const newState = {
        ...prevState,
        savedLayouts: [...prevState.savedLayouts, newLayout],
        currentLayoutId: newLayout.id,
      };
      updateLocalStorage(newState);
      return newState;
    });
    setNewLayoutName("");
  };

  const loadLayout = useCallback(
    (layoutId: string) => {
      if (layoutId === "new") {
        setState((prevState) => {
          const newState = {
            ...prevState,
            landWidth: 100,
            landHeight: 100,
            elements: [],
            currentLayoutId: null,
            newElementWidth: 10,
            newElementHeight: 10,
          };
          updateLocalStorage(newState);
          return newState;
        });
      } else {
        const layout = state.savedLayouts.find((l) => l.id === layoutId);
        if (layout) {
          setState((prevState) => {
            const newState = {
              ...prevState,
              landWidth: layout.landWidth,
              landHeight: layout.landHeight,
              elements: layout.elements,
              currentLayoutId: layout.id,
            };
            updateLocalStorage(newState);
            return newState;
          });
        }
      }
    },
    [state.savedLayouts, updateLocalStorage]
  );

  const deleteLayout = (layoutId: string | null) => {
    if (!layoutId) return;

    setState((prevState) => {
      const newState = {
        ...prevState,
        savedLayouts: prevState.savedLayouts.filter((l) => l.id !== layoutId),
        currentLayoutId: null,
      };
      updateLocalStorage(newState);
      return newState;
    });
  };

  useEffect(() => {
    if (sharedState) {
      setState(sharedState);
    } else {
      const storedState = localStorage.getItem("landVisualizerState");
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        setState(parsedState);
        setSharedState(parsedState);
        if (
          parsedState.savedLayouts.length > 0 &&
          !parsedState.currentLayoutId
        ) {
          loadLayout(parsedState.savedLayouts[0].id);
        }
      }
    }
  }, [sharedState, setSharedState, loadLayout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      const scale = 5;
      const canvasWidth = state.landWidth * scale;
      const canvasHeight = state.landHeight * scale;

      // Clear the entire canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw the land border
      ctx.strokeStyle = "black";
      ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

      // Draw elements
      state.elements.forEach((element) => {
        ctx.fillStyle = "rgba(0, 128, 0, 0.5)";
        ctx.fillRect(
          element.x * scale,
          element.y * scale,
          element.width * scale,
          element.height * scale
        );

        // Draw element size in the middle
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${element.width}m x ${element.height}m`,
          (element.x + element.width / 2) * scale,
          (element.y + element.height / 2) * scale
        );
      });
    }
  }, [state.landWidth, state.landHeight, state.elements]);

  const shareLayout = () => {
    const currentUrl = window.location.href.split("?")[0];
    const sharedUrl = `${currentUrl}?state=${encodeURIComponent(
      JSON.stringify(state)
    )}`;
    navigator.clipboard.writeText(sharedUrl).then(() => {
      alert("Link do udostępnienia skopiowany do schowka!");
    });
  };

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className={`flex ${isMobile ? "flex-col" : "h-screen"}`}>
      {/* Sidebar */}
      <div
        className={`${
          isMobile ? "w-full" : "w-1/4"
        } p-4 bg-gray-100 overflow-y-auto`}
      >
        <h2 className="text-xl font-semibold mb-2">Zapisane układy</h2>
        <Select
          onValueChange={loadLayout}
          value={state.currentLayoutId || "new"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz układ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Utwórz nowy układ</SelectItem>
            {state.savedLayouts.map((layout) => (
              <SelectItem key={layout.id} value={layout.id}>
                <div className="flex justify-between items-center w-full">
                  <span>{layout.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-4">
          <Input
            placeholder="Nazwa nowego układu"
            value={newLayoutName}
            onChange={(e) => setNewLayoutName(e.target.value)}
            className="mb-2"
          />
          <Button onClick={saveLayout} className="w-full justify-start mb-2">
            <Save className="mr-1 h-4 w-4" /> Zapisz obecny układ
          </Button>
          <Button
            className="w-full justify-start"
            variant="destructive"
            onClick={() => {
              deleteLayout(state.currentLayoutId);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Usuń układ
          </Button>
          <Button onClick={shareLayout} className="w-full justify-start mt-2">
            <Share2 className="mr-1 h-4 w-4" /> Udostępnij układ
          </Button>
        </div>

        {/* Elements list */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Elementy</h2>
          <ul>
            {state.elements.map((element) => (
              <li
                key={element.id}
                className="mb-4 p-2 border border-gray-300 rounded"
              >
                <Input
                  value={element.name}
                  onChange={(e) =>
                    updateElementName(element.id, e.target.value)
                  }
                  className="mb-2"
                />
                <div className="flex justify-between items-center">
                  <span>
                    {element.width}m x {element.height}m na pozycji (
                    {Math.round(element.x)}m, {Math.round(element.y)}m)
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeElement(element.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className={`${isMobile ? "w-full" : "flex-1"} p-4 overflow-y-auto`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Wizualizator działki</h1>

          <div
            className={`grid ${
              isMobile ? "grid-cols-1" : "grid-cols-2"
            } gap-4 mb-4`}
          >
            <div>
              <Label htmlFor="landWidth">Szerokość działki (m)</Label>
              <Input
                id="landWidth"
                type="number"
                value={state.landWidth}
                onChange={(e) =>
                  setState((prevState) => ({
                    ...prevState,
                    landWidth: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="landHeight">Długość działki (m)</Label>
              <Input
                id="landHeight"
                type="number"
                value={state.landHeight}
                onChange={(e) =>
                  setState((prevState) => ({
                    ...prevState,
                    landHeight: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Dodaj nowy element</h2>
            <div className="space-y-2">
              <div>
                <Label htmlFor="elementName">Nazwa elementu</Label>
                <Input
                  id="elementName"
                  value={newElementName}
                  onChange={(e) => setNewElementName(e.target.value)}
                  placeholder="Nazwa elementu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="elementWidth">Szerokość (m)</Label>
                  <Input
                    id="elementWidth"
                    type="number"
                    value={state.newElementWidth}
                    onChange={(e) =>
                      setState((prevState) => ({
                        ...prevState,
                        newElementWidth: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="elementHeight">Długość (m)</Label>
                  <Input
                    id="elementHeight"
                    type="number"
                    value={state.newElementHeight}
                    onChange={(e) =>
                      setState((prevState) => ({
                        ...prevState,
                        newElementHeight: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <Button onClick={addElement} className="w-full mt-2">
              <Plus className="mr-2 h-4 w-4" /> Dodaj element
            </Button>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Wizualizacja działki</h2>
            <div className="flex justify-center">
              <div
                className="relative"
                style={{ padding: isMobile ? "15px 25px" : "30px 50px" }}
              >
                <div
                  className="relative"
                  style={{
                    width: state.landWidth * (isMobile ? 3 : 5),
                    height: state.landHeight * (isMobile ? 3 : 5),
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={state.landWidth * (isMobile ? 3 : 5)}
                    height={state.landHeight * (isMobile ? 3 : 5)}
                    className="border border-gray-300"
                  />
                  {state.elements.map((element) => (
                    <Draggable
                      key={element.id}
                      bounds="parent"
                      defaultPosition={{
                        x: element.x * (isMobile ? 3 : 5),
                        y: element.y * (isMobile ? 3 : 5),
                      }}
                      onStop={(e, data) =>
                        updateElementPosition(
                          element.id,
                          data.x / (isMobile ? 3 : 5),
                          data.y / (isMobile ? 3 : 5)
                        )
                      }
                    >
                      <div
                        className="absolute bg-green-500 bg-opacity-50 cursor-move flex flex-col items-center justify-center"
                        style={{
                          width: element.width * (isMobile ? 3 : 5),
                          height: element.height * (isMobile ? 3 : 5),
                        }}
                      >
                        <span
                          className={`text-xs font-semibold ${
                            isMobile ? "hidden" : ""
                          }`}
                        >
                          {element.name}
                        </span>
                        <span className="text-xs">
                          {element.width}m x {element.height}m
                        </span>
                      </div>
                    </Draggable>
                  ))}
                </div>
                {/* Top dimension */}
                <div className="absolute top-0 left-0 w-full text-center text-sm">
                  {state.landWidth}m
                </div>
                {/* Bottom dimension */}
                <div className="absolute bottom-0 left-0 w-full text-center text-sm">
                  {state.landWidth}m
                </div>
                {/* Left dimension */}
                <div
                  className="absolute top-1/2 left-0 -translate-y-1/2 text-sm"
                  style={{
                    transform: "rotate(-90deg) translateX(-50%)",
                    transformOrigin: "0 0",
                  }}
                >
                  {state.landHeight}m
                </div>
                {/* Right dimension */}
                <div
                  className="absolute top-1/2 right-0 -translate-y-1/2 text-sm"
                  style={{
                    transform: "rotate(90deg) translateX(50%)",
                    transformOrigin: "100% 0",
                  }}
                >
                  {state.landHeight}m
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
