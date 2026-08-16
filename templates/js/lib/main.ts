import { nodes, routes } from "@{{name}}/routes.ts";
import { Node, ScribeServer } from "@scribe/sdk";

const server = new ScribeServer({ routes, nodes })
  .addNode(new Node({ name: "app", public: true }));

await server.run();
