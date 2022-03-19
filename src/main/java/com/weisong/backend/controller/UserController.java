package com.weisong.backend.controller;


import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.User;
import com.weisong.backend.entities.LoginUser;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.CreateTokenUtils;
import com.weisong.backend.util.Result.BlogJSONResult;
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


    static String field="";

//    注册用户
    @ResponseBody
    @RequestMapping(value = "/register",method = RequestMethod.POST)
    public BlogJSONResult registerUser(@RequestBody @Validated  LoginUser loginUser, BindingResult result){
        String regx = "(^[a-zA-Z0-9_-]{6,16}$)|(^[\u2E80-\u9FFF]{2,5})";
        if(!loginUser.getName().matches(regx)){
            //前端需要的
            return BlogJSONResult.errorMsg("用户名必须是6-16位数字和字母的组合或者2-5位中文");
        }
        if (result.hasErrors()){
//              获取校验的错误结果
            result.getFieldErrors().forEach((item)->{
                field = item.getField();
            });
            return BlogJSONResult.errorMsg( field + "格式不正确");
        }

        if (userService.checkName(loginUser.getName())){
            return BlogJSONResult.errorMsg( "用户名重复");
        }
        userService.insertUser(loginUser);
        return BlogJSONResult.ok();
    }


    //登录
    @ResponseBody
    @PostMapping("/login")
    public BlogJSONResult login(@RequestBody LoginUser loginUser){
        Map<String,Object> map=new HashMap<>();
        User userForBase;
        if (loginUser.getName() == null){
            userForBase = userService.findUserByEmail(loginUser.getEmail());
        }else{
            userForBase = userService.findUserByName(loginUser.getName());
        }
        if(userForBase == null){
            return BlogJSONResult.errorMsg("登录失败，用户名不存在");
        }else{
            if (!userForBase.getPassword().equals(loginUser.getPassword())){
                return BlogJSONResult.errorMsg("登录失败，密码错误");
            }else {
                String token = CreateTokenUtils.getToken(userForBase);
                map.put("token",token);
                map.put("user", userForBase);
                return BlogJSONResult.ok(map);
            }
        }
    }
    @UserLoginToken
    @GetMapping("/getMessage")
    public String getMessage(){

        return "你已通过验证";
    }


//    根据UUID注销用户
    @ResponseBody
    @RequestMapping(value = "/delete",method = RequestMethod.POST)
    public BlogJSONResult deleteUserById(@RequestBody Map<String,String> map){
        userService.deleteUserById(map.get("userUuid"));
        if(userService.findUserByUuid(map.get("userUuid")) != null){
            return BlogJSONResult.errorException("删除失败");
        }else{
            return BlogJSONResult.ok("删除成功");
        }
    }

    /**
     * 获取个人信息
     * @param map
     * @return
     */
    @ResponseBody
    @PostMapping("/getUserMess")
    public BlogJSONResult getUserMess(@RequestBody Map<String,String> map){
        if (userService.findUserByUuid(map.get("userUuid")) != null){
            return BlogJSONResult.ok(userService.findUserByUuid(map.get("userUuid")));
        }else {
            return BlogJSONResult.errorMsg("获取失败");
        }
    }

}
