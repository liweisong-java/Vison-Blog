package com.weisong.backend.util.Result;
import com.github.pagehelper.PageInfo;
import com.weisong.backend.util.Result.ResultEnum;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.weisong.backend.util.Result.ResultEnum.SUCCESS;

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

    @ApiModelProperty(value = "返回标记：成功标记=0，失败标记=1")
    private int status;

    @ApiModelProperty(value = "返回信息")
    private String msg;

    @ApiModelProperty(value = "数据")
    private T data;

    public static Map<String,Object> pageInfoToMap(PageInfo pageInfo)  {
        int recordsCount=pageInfo.getSize();
        int pageCount=pageInfo.getPages();
        List list1 = pageInfo.getList();
        Map<String,Object> map1=new HashMap<>();
        map1.put("recordsCount",recordsCount);
        map1.put("pageCount",pageCount);
        map1.put("list",list1);
        return  map1;
    }

    private static <T> Result<T> restResult(T data, int status, String msg) {
        Result<T> apiResult = new Result<>();
        apiResult.setStatus(status);
        apiResult.setData(data);
        apiResult.setMsg(msg);
        return apiResult;
    }

    public Result(ResultEnum resultEnum, T data) {
        this.status = resultEnum.getStatus();
        this.msg = resultEnum.getMsg();
        this.data = data;
    }

    public Result(ResultEnum resultEnum) {
        this.status = resultEnum.getStatus();
        this.msg = resultEnum.getMsg();
    }


    public Result<T> setData(T data) {
        this.data = data;
        return this;
    }

    /**
     * 成功
     */
    public static <T> Result<T> success() {
        return restResult(null, SUCCESS.getStatus(), SUCCESS.getMsg());
    }

    public static <T> Result<T> success(T data) {
        return restResult(data, SUCCESS.getStatus(), SUCCESS.getMsg());
    }
    public static <T> Result<T> success(T data, String msg) {
        return restResult(data, SUCCESS.getStatus(), SUCCESS.getMsg());
    }


    /**
     * 格式不正确 失败
     *
     **/



    public static Result formatError(int status, String data) {
        Result result = new Result();
        result.setStatus(status);
        result.setMsg(data + "格式不正确");
        return result;
    }



    public static Result nameFormatError(int status){
        Result result = new Result();
        result.setStatus(100);
        result.setMsg("用户名必须是6-16位数字和字母的组合或者2-5位中文");
        return result;
    }

    public static Result repetitionError(){
        Result result = new Result();
        result.setStatus(100);
        result.setMsg("用户名重复");
        return result;
    }

}
