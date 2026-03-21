import React, { useContext } from "react"
import { MediatorContext, ServerContext } from "../App"

export default class Game {

    server;
    mediator;

    constructor() {
        this.server = useContext(ServerContext);
        this.mediator = useContext(MediatorContext); // Надо сменить app на конексты и дописать тут штуки для получения и обработки данных
    }
}