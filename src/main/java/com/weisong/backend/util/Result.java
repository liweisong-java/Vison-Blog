package com.weisong.backend.util;
import com.weisong.backend.entities.Employee;
import com.weisong.backend.util.enums.ResultEnum;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.weisong.backend.util.enums.ResultEnum.*;

/**
 * @author 李伟松
 * @create 2022-02-17-16:36
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ApiModel(description = "响应信息主体")
public class Result <T> {

    @ApiModelProperty(value = "返回标记：成功标记=200，失败标记=400")
    private int status;

    @ApiModelProperty(value = "返回信息")
    private String msg;

    @ApiModelProperty(value = "数据")
    private T data;

    /**
     * 成功
     */
    public static <T> Result<T> success() {
        return restResult(null, SUCCESS.getStatus(), null);
    }

    public static <T> Result<T> success(T data) {
        return restResult(data, SUCCESS.getStatus(), null);
    }

    public static <T> Result<T> success(T data, String msg) {
        return restResult(data, SUCCESS.getStatus(), msg);
    }
    private static <T> Result<T> restResult(T data, int status, String msg) {
        Result<T> apiResult = new Result<>();
        apiResult.setStatus(status);
        apiResult.setData(data);
        apiResult.setMsg(msg);
        System.out.println(apiResult);
        return apiResult;
    }

    public Result(ResultEnum resultEnum, T data) {
        this.status = resultEnum.getStatus();
        this.msg = resultEnum.getMsg();
        this.data = data;
    }

    public Result(ResultEnum commonEnum) {
        this.status = commonEnum.getStatus();
        this.msg = commonEnum.getMsg();
    }


    public Result<T> setData(T data) {
        this.data = data;
        return this;
    }


    /**
     * 格式不正确 失败
     *
     **/



    public static Result error(int status, String data) {
        Result result = new Result();
        result.setStatus(status);
        result.setMsg(data + "格式不正确");
        return result;
    }
}
