import { useMemo, useState } from "react";
import FunctionPanel from "../components/FunctionPanel";
import GraphCanvas from "../components/GraphCanvas";
import { compileExpression } from "../utils/expressionParser";

const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `fn-${Math.random().toString(16).slice(2)}`;

const defaultFunctions = [
  { id: "f1", label: "f1", expression: "sin(x)", color: "#22d3ee", visible: true },
  { id: "f2", label: "f2", expression: "0.3*x^2 - 2", color: "#f59e0b", visible: true },
];

const compileFunction = (fn) => {
  const { evaluator, error } = compileExpression(fn.expression, { variables: ["x"] });
  if (!evaluator) {
    return { ...fn, evaluator: null, error: error ?? "Enter expression" };
  }
  return {
    ...fn,
    evaluator: (x) => evaluator({ x }),
    error: null,
  };
};

const LitFunctionsPage = () => {
  const [functions, setFunctions] = useState(defaultFunctions);
  const [viewState, setViewState] = useState({ scale: 90, offsetX: 0, offsetY: 0 });

  const compiledFunctions = useMemo(
    () => functions.map((fn) => compileFunction(fn)),
    [functions]
  );

  const updateFunction = (id, patch) => {
    setFunctions((list) =>
      list.map((fn) => (fn.id === id ? { ...fn, ...patch } : fn))
    );
  };

  const addFunction = () => {
    setFunctions((list) => {
      const index = list.length + 1;
      return [
        ...list,
        {
          id: makeId(),
          label: `f${index}`,
          expression: "cos(x)",
          color: "#a855f7",
          visible: true,
        },
      ];
    });
  };

  const removeFunction = (id) => {
    setFunctions((list) => list.filter((fn) => fn.id !== id));
  };

  const toggleVisibility = (id) => {
    setFunctions((list) =>
      list.map((fn) =>
        fn.id === id ? { ...fn, visible: !fn.visible } : fn
      )
    );
  };

  const resetView = () => setViewState({ scale: 90, offsetX: 0, offsetY: 0 });

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] overflow-hidden rounded-l-3xl">
      <FunctionPanel
        functions={compiledFunctions}
        onChange={updateFunction}
        onAdd={addFunction}
        onRemove={removeFunction}
        onToggleVisibility={toggleVisibility}
        onResetView={resetView}
      />
      <GraphCanvas
        functions={compiledFunctions}
        viewState={viewState}
        setViewState={setViewState}
      />
    </div>
  );
};

export default LitFunctionsPage;
