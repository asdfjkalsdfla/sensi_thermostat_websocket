export class SocketHelper {
  static stateHandler(data: any): void {
    const datetime = new Date().toLocaleString().replace(',', '');

    console.debug('received data at', datetime);
    console.debug(JSON.stringify(data));
  }

  static disconnectHandler(err): void {
    console.error('disconnected', err);
  }
}
