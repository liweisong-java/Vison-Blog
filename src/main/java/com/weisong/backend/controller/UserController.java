package com.weisong.backend.controller;

import com.weisong.backend.entities.User;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.Result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * @author 李伟松
 * @create 2022-02-26-11:39
 */

@RestController
@RequestMapping(value = "/user")
@CrossOrigin(origins = "http://localhost:9527", maxAge = 3600)
public class UserController {
    Logger logger = LoggerFactory.getLogger(UserController.class);
    @Autowired
    UserService userService;

    static String field="";

//    注册用户
    @ResponseBody
    @RequestMapping(value = "/register",method = RequestMethod.POST)
    public Result registerUser(@RequestBody @Validated User user, BindingResult result){
        logger.info("begin addUser");
        if (result.hasErrors()){
//              获取校验的错误结果
            result.getFieldErrors().forEach((item)->{
                field = item.getField();
            });
            return Result.formatError(1, field);
        }
        userService.insertUser(user);
        return Result.success();
    }

//    根据UUID删除用户
    @ResponseBody
    @RequestMapping(value = "/delete",method = RequestMethod.POST)
    public Result deleteUserById(@RequestBody Map<String,String> map){
        logger.info("begin deleteUserById");
        userService.deleteUserById(map);
        return Result.success();
    }




    @ResponseBody
    @RequestMapping("/checkUser")
    public Result checkUser(@RequestParam("name")String name){
        //先判断用户名是否是合法的表达式;
        String regx = "(^[a-zA-Z0-9_-]{6,16}$)|(^[\u2E80-\u9FFF]{2,5})";
        if(!name.matches(regx)){
            //前端需要的
            return Result.nameFormatError(100);
        }

        //数据库用户名重复校验
        boolean b = userService.checkUser(name);
        if(b){
            return Result.success();
        }else{
            return Result.repetitionError();
        }

    }

}
