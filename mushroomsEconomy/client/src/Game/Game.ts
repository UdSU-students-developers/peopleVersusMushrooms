import React, { useContext } from "react"
import { MediatorContext, ServerContext } from "../App"

export default class Game {

    map = [];

    server;
    mediator;

    constructor() {
        this.server = useContext(ServerContext);
        this.mediator = useContext(MediatorContext);
    }

}