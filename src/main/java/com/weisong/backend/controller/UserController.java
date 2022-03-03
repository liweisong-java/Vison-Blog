package com.weisong.backend.controller;


import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.User;
import com.weisong.backend.service.TokenService;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.Result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-02-26-11:39
 */

@RestController
@RequestMapping(value = "/user")
public class UserController {
    Logger logger = LoggerFactory.getLogger(UserController.class);
    @Autowired
    UserService userService;
    @Autowired
    TokenService tokenService;

    static String field="";

//    注册用户
    @ResponseBody
    @RequestMapping(value = "/register",method = RequestMethod.POST)
    public Result registerUser(@RequestBody @Validated User user, BindingResult result){
        logger.info("begin addUser");
        String regx = "(^[a-zA-Z0-9_-]{6,16}$)|(^[\u2E80-\u9FFF]{2,5})";
        if(!user.getName().matches(regx)){
            //前端需要的
            return Result.error(1,"用户名必须是6-16位数字和字母的组合或者2-5位中文");
        }
        if (result.hasErrors()){
//              获取校验的错误结果
            result.getFieldErrors().forEach((item)->{
                field = item.getField();
            });
            return Result.error(1, field + "格式不正确");
        }

        if (userService.checkName(user.getName())){
            return Result.error(1, "用户名重复");
        }
        userService.insertUser(user);
        return Result.success();
    }


    //登录
    @ResponseBody
    @PostMapping("/login")
    public Object login(@RequestBody User user){
        Map<String,Object> map=new HashMap<>();
        User userForBase = userService.findUserByName(user);
        if(userForBase==null){
            return Result.error(1, "登录失败，用户名不存在");
        }else {
            if (!userForBase.getPassword().equals(user.getPassword())){
                return Result.error(1, "登录失败，密码错误");
            }else {
                String token = tokenService.getToken(userForBase);
                map.put("token",token);
                map.put("user",userForBase);
                return Result.success(map);
            }
        }
    }
    @UserLoginToken
    @GetMapping("/getMessage")
    public String getMessage(){

        return "你已通过验证";
    }


//    根据UUID删除用户
    @ResponseBody
    @RequestMapping(value = "/delete",method = RequestMethod.POST)
    public Result deleteUserById(@RequestBody Map<String,String> map){
        logger.info("begin deleteUserById");
        userService.deleteUserById(map);
        return Result.success();
    }

}
