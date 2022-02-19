package com.weisong.backend.util;
import com.weisong.backend.util.enums.ResultEnum;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.HashMap;
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
public class Result <T> extends HashMap<String, Object> {
    @ApiModelProperty(value = "返回标记：成功标记=200，失败标记=400")
    private int status;

    @ApiModelProperty(value = "返回信息")
    private String msg;

    @ApiModelProperty(value = "数据")
    private T data;



    /**成功且带数据**/
    public static Result success(Object object){
        Result result = new Result();
        result.setStatus(ResultEnum.SUCCESS.getStatus());
        result.setMsg(ResultEnum.SUCCESS.getMsg());
        result.setData(object);
        return result;
    }

    /**成功但不带数据**/
    public static Result success(){

        return success(null);
    }

    /**
     * 格式不正确 失败
     *
     **/



    public static Result error(int status, String data) {
        Result result = new Result();
        result.put("status", status);
        result.put("msg", data + "格式不正确");
        return result;
    }
}
