package com.weisong.backend.controller;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import com.weisong.backend.service.ArticleService;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.Result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "/article")
@CrossOrigin(origins = "http://localhost:9527", maxAge = 3600)
public class ArticleController{
    Logger logger = LoggerFactory.getLogger(ArticleController.class);
    @Autowired
    ArticleService articleService;

//    查询所有文章
    @ResponseBody
    @GetMapping(value = "/listArticle")
    public Result getArticleList(){
        logger.info("begin getArticleList");
        return Result.success(articleService.getAllArticle());
    }

//    分页查询文章
    @ResponseBody
    @PostMapping(value = "/listPage")
    public Result<Map<String, Object>> ArticlePageList(@RequestBody Map map){
        Integer pageIndex=(Integer)map.get("pageIndex");
        Integer pageSize=(Integer)map.get("pageSize");
        PageHelper.startPage(pageIndex,pageSize);
        List<User> list = articleService.getAllArticle();
        PageInfo pageInfo=new PageInfo<>(list);
        return Result.success(Result.pageInfoToMap(pageInfo));
    }




//    @ResponseBody
//    @RequestMapping(value = "/changeEnable",method = RequestMethod.POST)
//    public Result changeEnableById(@RequestBody User user){
//        logger.info("begin changeEnableById");
//        return Result.success(userService.changeEnableById(user.getEmp_Id()));
//    }



}
