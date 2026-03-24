interface BadResponse {
    result: "error";
    error: {
        code: number;
        text: string;
    };
}
interface GoodResponse<T = any> {
    result: "ok";
    data: T;
}
declare class Answer {
    private errors;
    bad(code?: number): BadResponse;
    good<T>(data: T): GoodResponse<T>;
}
export default Answer;
